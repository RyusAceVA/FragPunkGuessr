import fs from "node:fs/promises";
import path from "node:path";

import {
  assetsRoot,
  parseFloorLevel,
  readImageSize,
} from "@/lib/server/assets";

/**
 * Accès disque au dossier d'assets (ASSETS_DIR, par défaut ./Maps).
 *
 * Convention par map :
 *   <ASSETS_DIR>/<NomDeLaMap>/
 *   ├── floors/       1F.png, 2F.png, B1.png…  (plans, PNG ou WebP)
 *   └── screenshots/  0001.webp, 0002.png…      (positions à deviner)
 *
 * Ajouter une map = déposer un dossier respectant cette convention,
 * puis lancer une synchronisation depuis le panneau admin.
 */

const IMAGE_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg"]);

export interface ScannedFloor {
  name: string;
  level: number;
  assetPath: string;
  width: number;
  height: number;
}

export interface ScannedScreenshot {
  code: string;
  assetPath: string;
}

export interface ScannedMap {
  dirName: string;
  floors: ScannedFloor[];
  screenshots: ScannedScreenshot[];
}

export interface ScanResult {
  maps: ScannedMap[];
  warnings: string[];
}

async function listImageFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter(
        (e) =>
          e.isFile() &&
          IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()),
      )
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/**
 * Scanne le dossier d'assets et retourne la structure découverte.
 * Les chemins retournés sont relatifs à ASSETS_DIR, avec des `/`
 * (indépendants de l'OS — c'est le format stocké en base).
 */
export async function scanAssets(): Promise<ScanResult> {
  const root = assetsRoot();
  const warnings: string[] = [];
  const maps: ScannedMap[] = [];

  let mapDirs: string[];
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    mapDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    warnings.push(`Assets folder not found: ${root}`);
    return { maps, warnings };
  }

  for (const dirName of mapDirs) {
    const floors: ScannedFloor[] = [];
    const screenshots: ScannedScreenshot[] = [];

    for (const file of await listImageFiles(
      path.join(root, dirName, "floors"),
    )) {
      const stem = path.parse(file).name;
      const level = parseFloorLevel(stem);
      if (level === null) {
        warnings.push(
          `${dirName}/floors/${file} : unreadable floor level (expected "1F", "B1", "RDC"…) — skipped`,
        );
        continue;
      }
      const absolute = path.join(root, dirName, "floors", file);
      const size = await readImageSize(absolute);
      if (!size) {
        warnings.push(
          `${dirName}/floors/${file} : unreadable dimensions (PNG/WebP expected) — skipped`,
        );
        continue;
      }
      floors.push({
        name: stem,
        level,
        assetPath: `${dirName}/floors/${file}`,
        width: size.width,
        height: size.height,
      });
    }

    for (const file of await listImageFiles(
      path.join(root, dirName, "screenshots"),
    )) {
      screenshots.push({
        code: path.parse(file).name,
        assetPath: `${dirName}/screenshots/${file}`,
      });
    }

    if (floors.length === 0 && screenshots.length === 0) {
      warnings.push(
        `${dirName}/ : no floor plan or screenshot found — folder skipped`,
      );
      continue;
    }

    maps.push({ dirName, floors, screenshots });
  }

  return { maps, warnings };
}
