import fs from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";

/**
 * Accès disque bas niveau au dossier d'assets (ASSETS_DIR).
 * Infra partagée entre l'admin (scan/sync) et le gameplay (lecture).
 */

export const ASSET_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export function assetsRoot(): string {
  return path.resolve(process.cwd(), env.ASSETS_DIR);
}

/**
 * Résout un chemin relatif vers un chemin absolu DANS le dossier d'assets.
 * Retourne null si le chemin tente d'en sortir (traversée `..`).
 */
export function resolveAssetPath(relativePath: string): string | null {
  const root = assetsRoot();
  const absolute = path.resolve(root, relativePath);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    return null;
  }
  return absolute;
}

/**
 * Niveau d'un étage à partir du nom de fichier (insensible à la casse) :
 *   "1F"/"1"/"Etage 1"/"Floor 1" → 1 · "2F" → 2 …
 *   "RDC"/"Ground"/"G"/"0F"      → 0
 *   "B1"/"-1"                    → -1 · "B2" → -2 …
 *   "Basement"/"Sous-sol"/"SS"   → -1
 *   "Roof"/"Toit"                → 99 (toujours au sommet)
 */
export function parseFloorLevel(stem: string): number | null {
  const s = stem
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, " ");
  if (s === "RDC" || s === "GROUND" || s === "G" || s === "0F") return 0;
  if (s === "ROOF" || s === "TOIT") return 99;
  if (s === "BASEMENT" || s === "SOUS SOL" || s === "SOUSSOL" || s === "SS") {
    return -1;
  }
  let m = /^B(\d+)$/.exec(s);
  if (m) return -Number(m[1]);
  m = /^(-?\d+)F?$/.exec(s);
  if (m) return Number(m[1]);
  m = /^(?:ETAGE|FLOOR|F) ?(-?\d+)$/.exec(s);
  if (m) return Number(m[1]);
  return null;
}

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

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

    if (buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }

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

/** Le dossier d'assets est-il inscriptible ? (faux sur Vercel : FS en lecture seule) */
export async function isAssetsRootWritable(): Promise<boolean> {
  try {
    await fs.access(assetsRoot(), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** Sert un fichier du dossier d'assets en réponse HTTP (image uniquement). */
export async function serveAssetFile(relativePath: string): Promise<Response> {
  const contentType =
    ASSET_CONTENT_TYPES[path.extname(relativePath).toLowerCase()];
  if (!contentType) {
    return Response.json(
      { error: "Type de fichier non servi" },
      { status: 404 },
    );
  }

  const absolutePath = resolveAssetPath(relativePath);
  if (!absolutePath) {
    return Response.json({ error: "Chemin invalide" }, { status: 400 });
  }

  try {
    const [file, stat] = await Promise.all([
      fs.readFile(absolutePath),
      fs.stat(absolutePath),
    ]);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Last-Modified": stat.mtime.toUTCString(),
        // Les assets changent rarement : cache navigateur d'une heure
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
