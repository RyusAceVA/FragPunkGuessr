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
