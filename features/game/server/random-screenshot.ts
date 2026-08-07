import { prisma } from "@/lib/prisma";

/**
 * Options réservées aux évolutions futures (non implémentées) :
 *  - seed : tirage reproductible (défis quotidiens, duels)
 * `excludeIds` est, lui, actif : il garantit qu'une partie ne contient
 * jamais deux fois le même screenshot.
 */
export interface PickRandomOptions {
  excludeIds?: string[];
  /** Restreint le tirage à une seule map (Map Training) */
  mapId?: string;
  seed?: number;
}

const PLAYABLE_WHERE = {
  isActive: true,
  pixelX: { not: null },
  pixelY: { not: null },
  floorId: { not: null },
} as const;

/** Mélange de Fisher-Yates partiel : les `count` premiers sont uniformes. */
function sample<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Tire `count` screenshots jouables DISTINCTS, toutes maps confondues
 * (tirage sans remise). Peut en renvoyer moins si le pool est petit.
 */
export async function pickRandomScreenshots(
  count: number,
  options: PickRandomOptions = {},
): Promise<string[]> {
  const candidates = await prisma.screenshot.findMany({
    where: {
      ...PLAYABLE_WHERE,
      ...(options.mapId ? { mapId: options.mapId } : {}),
      ...(options.excludeIds?.length
        ? { id: { notIn: options.excludeIds } }
        : {}),
    },
    select: { id: true },
  });

  return sample(
    candidates.map((c) => c.id),
    count,
  );
}
