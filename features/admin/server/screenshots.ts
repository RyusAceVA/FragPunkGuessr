import { prisma } from "@/lib/prisma";
import type { Difficulty } from "@/types";

import type { UpdateScreenshotInput } from "../schemas";
import type {
  AdminFloor,
  AdminMap,
  AdminScreenshot,
  AdminZone,
} from "../types";

/** Erreur métier portant un statut HTTP, interceptée par les routes API. */
export class AdminError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ScreenshotRecord {
  id: string;
  mapId: string;
  floorId: string | null;
  code: string;
  assetPath: string;
  pixelX: number | null;
  pixelY: number | null;
  difficulty: string | null;
  orientation: number | null;
  zoneId: string | null;
  notes: string | null;
  isActive: boolean;
  zone: { name: string } | null;
  tags: { name: string }[];
}

function serializeScreenshot(s: ScreenshotRecord): AdminScreenshot {
  return {
    id: s.id,
    mapId: s.mapId,
    floorId: s.floorId,
    code: s.code,
    assetPath: s.assetPath,
    pixelX: s.pixelX,
    pixelY: s.pixelY,
    difficulty: (s.difficulty as Difficulty | null) ?? null,
    orientation: s.orientation,
    zoneId: s.zoneId,
    zoneName: s.zone?.name ?? null,
    notes: s.notes,
    tags: s.tags.map((t) => t.name).sort(),
    isActive: s.isActive,
  };
}

const SCREENSHOT_INCLUDE = {
  tags: true,
  zone: { select: { name: true } },
} as const;

/** Maps avec leurs étages, zones et compteurs (total / placés). */
export async function listAdminMaps(): Promise<AdminMap[]> {
  const maps = await prisma.gameMap.findMany({
    orderBy: { name: "asc" },
    include: {
      floors: { orderBy: { level: "asc" } },
      zones: {
        orderBy: { name: "asc" },
        include: { _count: { select: { screenshots: true } } },
      },
      _count: { select: { screenshots: { where: { isActive: true } } } },
    },
  });

  const placedCounts = await prisma.screenshot.groupBy({
    by: ["mapId"],
    where: { isActive: true, pixelX: { not: null } },
    _count: { _all: true },
  });
  const placedByMap = new Map(
    placedCounts.map((p) => [p.mapId, p._count._all]),
  );

  return maps.map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    assetDir: m.assetDir,
    floors: m.floors.map((f): AdminFloor => ({
      id: f.id,
      mapId: f.mapId,
      name: f.name,
      level: f.level,
      assetPath: f.assetPath,
      width: f.width,
      height: f.height,
    })),
    zones: m.zones.map((z): AdminZone => ({
      id: z.id,
      mapId: z.mapId,
      name: z.name,
      screenshotCount: z._count.screenshots,
    })),
    screenshotCount: m._count.screenshots,
    placedCount: placedByMap.get(m.id) ?? 0,
  }));
}

/** Tous les screenshots actifs d'une map (placés ou non). */
export async function listScreenshots(
  mapId: string,
): Promise<AdminScreenshot[]> {
  const screenshots = await prisma.screenshot.findMany({
    where: { mapId, isActive: true },
    orderBy: { code: "asc" },
    include: SCREENSHOT_INCLUDE,
  });
  return screenshots.map(serializeScreenshot);
}

/**
 * Mise à jour partielle : placement (position pixel sur un étage,
 * ou retrait du marqueur) et/ou métadonnées. L'autosave n'envoie que
 * les champs modifiés — tout est optionnel.
 */
export async function updateScreenshot(
  id: string,
  input: UpdateScreenshotInput,
): Promise<AdminScreenshot> {
  const current = await prisma.screenshot.findUnique({
    where: { id },
    select: { mapId: true },
  });
  if (!current) throw new AdminError(404, "Screenshot introuvable");

  const data: Record<string, unknown> = {};

  if (input.placement !== undefined) {
    if (input.placement === null) {
      data.floorId = null;
      data.pixelX = null;
      data.pixelY = null;
    } else {
      const floor = await prisma.floor.findUnique({
        where: { id: input.placement.floorId },
      });
      if (!floor || floor.mapId !== current.mapId) {
        throw new AdminError(400, "Étage invalide pour cette map");
      }
      data.floorId = floor.id;
      // Garde-fou serveur : la position reste dans les bornes du plan
      data.pixelX = Math.min(input.placement.pixelX, floor.width);
      data.pixelY = Math.min(input.placement.pixelY, floor.height);
    }
  }

  if (input.zoneId !== undefined) {
    if (input.zoneId === null) {
      data.zoneId = null;
    } else {
      const zone = await prisma.zone.findUnique({
        where: { id: input.zoneId },
      });
      if (!zone || zone.mapId !== current.mapId) {
        throw new AdminError(400, "Zone invalide pour cette map");
      }
      data.zoneId = zone.id;
    }
  }

  if (input.difficulty !== undefined) data.difficulty = input.difficulty;
  if (input.orientation !== undefined) data.orientation = input.orientation;
  if (input.notes !== undefined) data.notes = input.notes || null;

  if (input.tags !== undefined) {
    const names = [
      ...new Set(input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
    ];
    data.tags = {
      set: [],
      connectOrCreate: names.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  const updated = await prisma.screenshot.update({
    where: { id },
    data,
    include: SCREENSHOT_INCLUDE,
  });
  return serializeScreenshot(updated);
}
