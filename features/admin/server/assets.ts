import fs from "node:fs/promises";
import path from "node:path";

import { assetsRoot } from "@/lib/server/assets";

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

/**
 * Niveau d'un étage à partir du nom de fichier :
 * "1F"/"1" → 1, "2F" → 2, "B1" → -1, "RDC"/"0F" → 0.
 */
export function parseFloorLevel(stem: string): number | null {
  const s = stem.trim().toUpperCase();
  if (s === "RDC") return 0;
  let m = /^B(\d+)$/.exec(s);
  if (m) return -Number(m[1]);
  m = /^(-?\d+)F?$/.exec(s);
  if (m) return Number(m[1]);
  m = /^(?:ETAGE|FLOOR|F)[-_ ]?(-?\d+)$/.exec(s);
  if (m) return Number(m[1]);
  return null;
}

/**
 * Dimensions d'une image PNG ou WebP en lisant uniquement son en-tête
 * (pas de dépendance native, instantané même sur de gros fichiers).
 */
export async function readImageSize(
  absolutePath: string,
): Promise<{ width: number; height: number } | null> {
  const handle = await fs.open(absolutePath, "r");
  try {
    const buf = Buffer.alloc(32);
    await handle.read(buf, 0, 32, 0);

    // PNG : signature 8 octets, IHDR → largeur/hauteur en big-endian
    const PNG_SIG = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    if (buf.subarray(0, 8).equals(PNG_SIG)) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }

    // WebP : conteneur RIFF, 3 variantes de flux
    if (
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    ) {
      const fourcc = buf.toString("ascii", 12, 16);
      if (fourcc === "VP8X") {
        return {
          width: 1 + buf.readUIntLE(24, 3),
          height: 1 + buf.readUIntLE(27, 3),
        };
      }
      if (fourcc === "VP8L") {
        const bits = buf.readUInt32LE(21);
        return {
          width: (bits & 0x3fff) + 1,
          height: ((bits >> 14) & 0x3fff) + 1,
        };
      }
      if (fourcc === "VP8 ") {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
    }

    return null;
  } finally {
    await handle.close();
  }
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
    warnings.push(`Dossier d'assets introuvable : ${root}`);
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
          `${dirName}/floors/${file} : niveau illisible (attendu "1F", "B1", "RDC"…) — ignoré`,
        );
        continue;
      }
      const absolute = path.join(root, dirName, "floors", file);
      const size = await readImageSize(absolute);
      if (!size) {
        warnings.push(
          `${dirName}/floors/${file} : dimensions illisibles (PNG/WebP attendu) — ignoré`,
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
        `${dirName}/ : aucun plan ni screenshot trouvé — dossier ignoré`,
      );
      continue;
    }

    maps.push({ dirName, floors, screenshots });
  }

  return { maps, warnings };
}
