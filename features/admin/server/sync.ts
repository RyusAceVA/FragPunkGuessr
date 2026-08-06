import { prisma } from "@/lib/prisma";

import { scanAssets } from "./assets";
import type { SyncSummary } from "../types";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Synchronise la base avec le dossier d'assets :
 *  - crée/actualise les maps, étages et screenshots découverts
 *  - désactive les screenshots dont le fichier a disparu (sans les
 *    supprimer : leurs placements et métadonnées sont conservés)
 *
 * Idempotent — peut être relancé à tout moment sans effet de bord.
 */
export async function syncAssets(): Promise<SyncSummary> {
  const { maps: scanned, warnings } = await scanAssets();

  let floorCount = 0;
  let screenshotsCreated = 0;
  let screenshotsTotal = 0;
  const seenScreenshotPaths: string[] = [];

  for (const scannedMap of scanned) {
    const map = await prisma.gameMap.upsert({
      where: { assetDir: scannedMap.dirName },
      update: { name: scannedMap.dirName },
      create: {
        assetDir: scannedMap.dirName,
        slug: slugify(scannedMap.dirName),
        name: scannedMap.dirName,
      },
    });

    for (const floor of scannedMap.floors) {
      await prisma.floor.upsert({
        where: { assetPath: floor.assetPath },
        update: {
          name: floor.name,
          level: floor.level,
          width: floor.width,
          height: floor.height,
        },
        create: {
          mapId: map.id,
          name: floor.name,
          level: floor.level,
          assetPath: floor.assetPath,
          width: floor.width,
          height: floor.height,
        },
      });
      floorCount += 1;
    }

    for (const screenshot of scannedMap.screenshots) {
      seenScreenshotPaths.push(screenshot.assetPath);
      const existing = await prisma.screenshot.findUnique({
        where: { assetPath: screenshot.assetPath },
        select: { id: true, isActive: true },
      });
      if (existing) {
        if (!existing.isActive) {
          await prisma.screenshot.update({
            where: { id: existing.id },
            data: { isActive: true },
          });
        }
      } else {
        await prisma.screenshot.create({
          data: {
            mapId: map.id,
            assetPath: screenshot.assetPath,
            code: screenshot.code,
          },
        });
        screenshotsCreated += 1;
      }
      screenshotsTotal += 1;
    }
  }

  // Fichiers disparus → désactivation (placements et métadonnées conservés)
  const { count: deactivated } = await prisma.screenshot.updateMany({
    where: { assetPath: { notIn: seenScreenshotPaths }, isActive: true },
    data: { isActive: false },
  });

  return {
    maps: scanned.length,
    floors: floorCount,
    screenshotsCreated,
    screenshotsTotal,
    deactivated,
    warnings,
  };
}
