import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type {
  LeaderboardData,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardSelf,
} from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  LeaderboardService — classements par MEILLEURE partie terminée.
 *
 *  · Entièrement basé sur les GameSession existantes : aucun recalcul,
 *    aucune table de score parallèle.
 *  · All-time tous modes = lecture directe de UserStats.bestScore
 *    (cache incrémental maintenu par le gameplay) : O(joueurs), une
 *    seule requête indexée.
 *  · Périodes (jour/semaine/mois) et classements par MODE = GROUP BY
 *    sur les sessions COMPLETED de la fenêtre — index
 *    (status, completedAt), fenêtre courte, jamais de scan global.
 *  · Saisons futures = une période de plus (bornes de saison) ;
 *    classements par mode = paramètre `mode` déjà en place.
 * ═══════════════════════════════════════════════════════════════════
 */

/** Début de la fenêtre d'une période (UTC) — null = depuis toujours. */
export function periodStart(
  period: LeaderboardPeriod,
  now: Date = new Date(),
): Date | null {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  switch (period) {
    case "daily":
      return new Date(today);
    case "weekly": {
      // Semaine ISO : lundi 00:00 UTC
      const day = new Date(today).getUTCDay();
      const sinceMonday = (day + 6) % 7;
      return new Date(today - sinceMonday * 86_400_000);
    }
    case "monthly":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    case "alltime":
      return null;
  }
}

interface GetLeaderboardOptions {
  period: LeaderboardPeriod;
  /** Restreint à un mode (ex. "DAILY" pour le défi du jour) */
  mode?: string | null;
  limit?: number;
  /** Joueur courant : sa position est calculée même hors du top */
  userId?: string | null;
}

export async function getLeaderboard({
  period,
  mode = null,
  limit = 50,
  userId = null,
}: GetLeaderboardOptions): Promise<LeaderboardData> {
  const start = periodStart(period);

  // Chemin rapide : all-time tous modes → UserStats (cache O(1)/joueur)
  if (start === null && mode === null) {
    const rows = await prisma.userStats.findMany({
      where: { bestScore: { gt: 0 }, user: { isActive: true } },
      orderBy: [{ bestScore: "desc" }, { userId: "asc" }],
      take: limit,
      include: {
        user: {
          select: { username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    const entries: LeaderboardEntry[] = rows.map((row, i) => ({
      rank: i + 1,
      userId: row.userId,
      username: row.user.username,
      displayName: row.user.displayName,
      avatarUrl: row.user.avatarUrl,
      bestScore: row.bestScore,
      gamesPlayed: row.gamesPlayed,
    }));

    let me: LeaderboardSelf | null = null;
    if (userId) {
      const mine = await prisma.userStats.findUnique({ where: { userId } });
      if (mine && mine.bestScore > 0) {
        const ahead = await prisma.userStats.count({
          where: {
            bestScore: { gt: mine.bestScore },
            user: { isActive: true },
          },
        });
        me = { rank: ahead + 1, bestScore: mine.bestScore };
      }
    }
    return { period, mode, entries, me };
  }

  // Périodes / par mode : agrégation sur les sessions de la fenêtre
  const windowFilter = start
    ? Prisma.sql`AND g."completedAt" >= ${start}`
    : Prisma.empty;
  const modeFilter = mode ? Prisma.sql`AND g.mode = ${mode}` : Prisma.empty;

  const rows = await prisma.$queryRaw<
    {
      user_id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      best_score: number;
      games: number;
    }[]
  >(Prisma.sql`
    SELECT g."userId" AS user_id, u.username,
      u."displayName" AS display_name, u."avatarUrl" AS avatar_url,
      MAX(g.score)::int AS best_score, COUNT(*)::int AS games
    FROM "GameSession" g
    JOIN "User" u ON u.id = g."userId" AND u."isActive"
    WHERE g.status = 'COMPLETED' AND g."userId" IS NOT NULL
      ${windowFilter} ${modeFilter}
    GROUP BY g."userId", u.username, u."displayName", u."avatarUrl"
    ORDER BY best_score DESC, u.username ASC
    LIMIT ${limit}
  `);

  const entries: LeaderboardEntry[] = rows.map((row, i) => ({
    rank: i + 1,
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bestScore: row.best_score,
    gamesPlayed: row.games,
  }));

  let me: LeaderboardSelf | null = null;
  if (userId) {
    const inTop = entries.find((e) => e.userId === userId);
    if (inTop) {
      me = { rank: inTop.rank, bestScore: inTop.bestScore };
    } else {
      const [mine] = await prisma.$queryRaw<
        { best_score: number; ahead: number }[]
      >(Prisma.sql`
        WITH bests AS (
          SELECT g."userId" AS uid, MAX(g.score) AS best
          FROM "GameSession" g
          WHERE g.status = 'COMPLETED' AND g."userId" IS NOT NULL
            ${windowFilter} ${modeFilter}
          GROUP BY g."userId"
        )
        SELECT b.best::int AS best_score,
          (SELECT COUNT(*)::int FROM bests o WHERE o.best > b.best) AS ahead
        FROM bests b WHERE b.uid = ${userId}
      `);
      if (mine) me = { rank: mine.ahead + 1, bestScore: mine.best_score };
    }
  }

  return { period, mode, entries, me };
}
