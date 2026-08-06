import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { prisma } from "@/lib/prisma";
import { assetsRoot, parseFloorLevel } from "@/lib/server/assets";

import { AssetsError } from "./maps";

const ALLOWED_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg"]);
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 Mo par fichier

const THUMBNAIL_WIDTH = 320;

function sanitizeStem(fileName: string): string {
  const stem = path.parse(fileName).name;
  const clean = stem
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return clean || "image";
}

function assertAllowedExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AssetsError(
      422,
      `Unsupported format (${ext || "no extension"}) — PNG, WebP or JPEG expected`,
    );
  }
  return ext;
}

/** Écriture atomique : fichier temporaire puis rename — jamais de fichier corrompu. */
async function writeFileAtomic(absolutePath: string, bytes: Buffer) {
  const tmp = `${absolutePath}.tmp`;
  await fs.writeFile(tmp, bytes);
  await fs.rename(tmp, absolutePath);
}

async function getMapOrThrow(mapId: string) {
  const map = await prisma.gameMap.findUnique({ where: { id: mapId } });
  if (!map) throw new AssetsError(404, "Map not found");
  return map;
}

async function imageDimensions(bytes: Buffer) {
  try {
    const meta = await sharp(bytes).metadata();
    if (!meta.width || !meta.height) throw new Error("no dimensions");
    return { width: meta.width, height: meta.height };
  } catch {
    throw new AssetsError(422, "Unreadable file — is it really an image?");
  }
}

/**
 * Importe un plan d'étage : le niveau est déduit du nom de fichier
 * (1F, 2F, B1, RDC, Roof…). Ré-uploader le même fichier remplace le plan ;
 * un niveau déjà fourni par un AUTRE fichier est refusé (pas d'écrasement
 * silencieux).
 */
export async function saveFloorPlan(
  mapId: string,
  fileName: string,
  bytes: Buffer,
): Promise<{ label: string }> {
  const map = await getMapOrThrow(mapId);
  assertAllowedExtension(fileName);

  const stem = sanitizeStem(fileName);
  const level = parseFloorLevel(stem);
  if (level === null) {
    throw new AssetsError(
      422,
      `Floor not recognized in “${stem}” — accepted names: 1F, 2F…, B1, B2, RDC, Roof, Basement`,
    );
  }

  const { width, height } = await imageDimensions(bytes);

  const assetPath = `${map.assetDir}/floors/${stem}${path.extname(fileName).toLowerCase()}`;
  const conflictingFloor = await prisma.floor.findFirst({
    where: { mapId, level, NOT: { assetPath } },
  });
  if (conflictingFloor) {
    throw new AssetsError(
      409,
      `Floor “${conflictingFloor.name}” (level ${level}) already exists via another file`,
    );
  }

  await writeFileAtomic(path.join(assetsRoot(), assetPath), bytes);

  await prisma.floor.upsert({
    where: { assetPath },
    update: { name: stem, level, width, height },
    create: { mapId, name: stem, level, assetPath, width, height },
  });

  return { label: stem };
}

/**
 * Importe un screenshot : copie du fichier (nom dédoublonné, jamais
 * d'écrasement), miniature WebP, entrée en base prête pour le placement.
 */
export async function saveScreenshot(
  mapId: string,
  fileName: string,
  bytes: Buffer,
): Promise<{ label: string; warning?: string }> {
  const map = await getMapOrThrow(mapId);
  const ext = assertAllowedExtension(fileName);
  await imageDimensions(bytes); // valide que c'est une image lisible

  // Nom unique : jamais d'écrasement (disque NI base)
  const baseStem = sanitizeStem(fileName);
  let stem = baseStem;
  for (let i = 2; ; i++) {
    const candidatePath = `${map.assetDir}/screenshots/${stem}${ext}`;
    const [onDisk, inDb] = await Promise.all([
      fs
        .access(path.join(assetsRoot(), candidatePath))
        .then(() => true)
        .catch(() => false),
      prisma.screenshot.findFirst({
        where: { mapId, OR: [{ assetPath: candidatePath }, { code: stem }] },
        select: { id: true },
      }),
    ]);
    if (!onDisk && !inDb) break;
    stem = `${baseStem}-${i}`;
  }

  const assetPath = `${map.assetDir}/screenshots/${stem}${ext}`;
  await writeFileAtomic(path.join(assetsRoot(), assetPath), bytes);

  let warning: string | undefined;
  try {
    const thumbsDir = path.join(assetsRoot(), map.assetDir, "thumbs");
    await fs.mkdir(thumbsDir, { recursive: true });
    await sharp(bytes)
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(path.join(thumbsDir, `${stem}.webp`));
  } catch {
    warning = "thumbnail not generated";
  }

  await prisma.screenshot.create({
    data: { mapId, assetPath, code: stem },
  });

  return { label: stem, warning };
}
