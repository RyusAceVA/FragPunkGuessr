import { prisma } from "@/lib/prisma";

export interface PickRandomOptions {
  excludeIds?: string[];
  /** Restreint le tirage à une seule map (Map Training) */
  mapId?: string;
  /**
   * Tirage REPRODUCTIBLE (Daily Challenge, futurs duels) : même seed +
   * même pool → mêmes screenshots dans le même ordre, pour tout le
   * monde. Sans seed : tirage aléatoire classique.
   */
  seed?: number;
}

/** PRNG déterministe (mulberry32) — suffisant pour un shuffle seedé. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed d'un jour UTC ("2026-08-07") — hash FNV-1a de la date. */
export function dailySeed(date: Date = new Date()): number {
  const key = date.toISOString().slice(0, 10);
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const PLAYABLE_WHERE = {
  isActive: true,
  pixelX: { not: null },
  pixelY: { not: null },
  floorId: { not: null },
} as const;

/** Mélange de Fisher-Yates partiel : les `count` premiers sont uniformes. */
function sample<T>(items: T[], count: number, random: () => number): T[] {
  const pool = [...items];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
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
    // Ordre stable : indispensable à la reproductibilité du tirage seedé
    orderBy: { id: "asc" },
  });

  const random =
    options.seed !== undefined ? mulberry32(options.seed) : Math.random;

  return sample(
    candidates.map((c) => c.id),
    count,
    random,
  );
}
