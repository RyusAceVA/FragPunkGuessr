import fs from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { assetsRoot } from "@/lib/server/assets";

/** Erreur métier portant un statut HTTP, interceptée par les routes API. */
export class AssetsError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Crée une map : la structure disque (floors/, screenshots/, thumbs/)
 * ET l'entrée en base. Le dossier respecte exactement la convention de
 * la synchronisation existante — les deux systèmes restent compatibles.
 */
export async function createAssetsMap(name: string, code: string) {
  const existing = await prisma.gameMap.findFirst({
    where: { OR: [{ slug: code }, { assetDir: code }] },
    select: { id: true },
  });
  if (existing) {
    throw new AssetsError(409, `La map « ${code} » existe déjà`);
  }

  const mapDir = path.join(assetsRoot(), code);
  await fs.mkdir(path.join(mapDir, "floors"), { recursive: true });
  await fs.mkdir(path.join(mapDir, "screenshots"), { recursive: true });
  await fs.mkdir(path.join(mapDir, "thumbs"), { recursive: true });

  const map = await prisma.gameMap.create({
    data: { name, slug: code, assetDir: code },
  });

  return { id: map.id, name: map.name, assetDir: map.assetDir };
}
