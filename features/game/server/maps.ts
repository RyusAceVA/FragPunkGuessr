import { prisma } from "@/lib/prisma";

import type { GameFloor, PlayableMap } from "../types";

/**
 * Maps jouables : au moins un screenshot actif et placé.
 * Ne renvoie que ce dont le jeu a besoin — aucune métadonnée admin.
 */
export async function listPlayableMaps(): Promise<PlayableMap[]> {
  const maps = await prisma.gameMap.findMany({
    orderBy: { name: "asc" },
    include: {
      floors: { orderBy: { level: "asc" } },
      _count: {
        select: {
          screenshots: {
            where: {
              isActive: true,
              pixelX: { not: null },
              floorId: { not: null },
            },
          },
        },
      },
    },
  });

  return maps
    .filter((m) => m._count.screenshots > 0 && m.floors.length > 0)
    .map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      floors: m.floors.map((f): GameFloor => ({
        id: f.id,
        name: f.name,
        level: f.level,
        assetPath: f.assetPath,
        width: f.width,
        height: f.height,
      })),
      screenshotCount: m._count.screenshots,
    }));
}
