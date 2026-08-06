import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { AdminError } from "./screenshots";
import type { AdminZone } from "../types";

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function serializeZone(zone: {
  id: string;
  mapId: string;
  name: string;
  _count: { screenshots: number };
}): AdminZone {
  return {
    id: zone.id,
    mapId: zone.mapId,
    name: zone.name,
    screenshotCount: zone._count.screenshots,
  };
}

export async function createZone(
  mapId: string,
  name: string,
): Promise<AdminZone> {
  const map = await prisma.gameMap.findUnique({ where: { id: mapId } });
  if (!map) throw new AdminError(404, "Map not found");

  try {
    const zone = await prisma.zone.create({
      data: { mapId, name },
      include: { _count: { select: { screenshots: true } } },
    });
    return serializeZone(zone);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AdminError(409, `Zone “${name}” already exists on this map`);
    }
    throw error;
  }
}

export async function renameZone(id: string, name: string): Promise<AdminZone> {
  try {
    const zone = await prisma.zone.update({
      where: { id },
      data: { name },
      include: { _count: { select: { screenshots: true } } },
    });
    return serializeZone(zone);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AdminError(409, `Zone “${name}” already exists on this map`);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AdminError(404, "Zone not found");
    }
    throw error;
  }
}

/** Suppression : les screenshots liés repassent simplement à « sans zone ». */
export async function deleteZone(id: string): Promise<void> {
  try {
    await prisma.zone.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AdminError(404, "Zone not found");
    }
    throw error;
  }
}
