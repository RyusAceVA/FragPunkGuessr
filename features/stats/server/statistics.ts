import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SCORE_CONFIG } from "@/lib/score";
import type { GameMode } from "@/types";

import type {
  FloorStatsEntry,
  HeatmapData,
  HeatmapFloor,
  HistoryEntry,
  MapStatsEntry,
  PlayerStatistics,
  ProgressionPoint,
  SessionDetail,
  SessionDetailRound,
  StatsOverview,
} from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  StatisticsService — moteur de statistiques du joueur.
 *
 *  Principes :
 *  · SOURCE DE VÉRITÉ : GameSession + Round. Rien n'est dupliqué —
 *    chaque statistique est une agrégation SQL sur ces tables.
 *  · TOUT est calculé EN BASE (COUNT/SUM/AVG/FILTER/GROUP BY) : les
 *    composants React ne font qu'afficher. Chaque requête est bornée
 *    à UN userId (index GameSession.userId) et aux manches jouées —
 *    jamais de scan global, jamais d'agrégation en JavaScript.
 *  · UserStats (mis à jour incrémentalement par le gameplay à chaque
 *    manche) est un cache dénormalisé O(1) réservé aux futures
 *    lectures inter-joueurs (classements) ; cette page lit le SQL
 *    frais pour être toujours exacte.
 *
 *  Réutilisation future : succès (seuils sur StatsOverview),
 *  classements (UserStats trié), défis quotidiens (mêmes agrégats
 *  filtrés sur une session seed), profils publics (getPlayerStatistics
 *  avec l'userId d'un autre joueur).
 * ═══════════════════════════════════════════════════════════════════
 */

/** Filtre de mode optionnel (null = tous les modes confondus). */
const MODE_FILTER = (mode: GameMode | null) =>
  mode ? Prisma.sql`AND g.mode = ${mode}` : Prisma.empty;

/** Jointures des manches d'un joueur (vérité terrain + réponse). */
const ROUNDS_FROM = (userId: string, mode: GameMode | null) => Prisma.sql`
  FROM "Round" r
  JOIN "GameSession" g ON g.id = r."sessionId"
    AND g."userId" = ${userId} ${MODE_FILTER(mode)}
  JOIN "Screenshot" s ON s.id = r."screenshotId"
  JOIN "GameMap" m ON m.id = s."mapId"
  LEFT JOIN "Floor" gf ON gf.id = r."guessFloorId"
`;

/** Une manche est « jouée » quand sa réponse a été validée. */
const PLAYED = Prisma.sql`(r."guessFloorId" IS NOT NULL OR r."timedOut")`;

async function getOverview(
  userId: string,
  mode: GameMode | null,
): Promise<StatsOverview> {
  const [sessions] = await prisma.$queryRaw<
    {
      games_played: number;
      games_completed: number;
      best_score: number;
      average_score: number;
    }[]
  >(Prisma.sql`
    SELECT
      COUNT(*)::int AS games_played,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS games_completed,
      COALESCE(MAX(score) FILTER (WHERE status = 'COMPLETED'), 0)::int AS best_score,
      COALESCE(AVG(score) FILTER (WHERE status = 'COMPLETED'), 0)::float AS average_score
    FROM "GameSession" g
    WHERE g."userId" = ${userId} ${MODE_FILTER(mode)}
  `);

  const [rounds] = await prisma.$queryRaw<
    {
      rounds_played: number;
      rounds_won: number;
      total_score: number;
      perfects: number;
      wrong_maps: number;
      wrong_floors: number;
      avg_distance: number | null;
      avg_time_ms: number | null;
    }[]
  >(Prisma.sql`
    SELECT
      COUNT(*)::int AS rounds_played,
      COUNT(*) FILTER (WHERE r."guessFloorId" = s."floorId")::int AS rounds_won,
      COALESCE(SUM(r.score), 0)::int AS total_score,
      COUNT(*) FILTER (WHERE r.score = ${SCORE_CONFIG.maxPerRound})::int AS perfects,
      COUNT(*) FILTER (
        WHERE gf."mapId" IS NOT NULL AND gf."mapId" <> s."mapId"
      )::int AS wrong_maps,
      COUNT(*) FILTER (
        WHERE gf."mapId" = s."mapId" AND r."guessFloorId" <> s."floorId"
      )::int AS wrong_floors,
      AVG(r.distance)::float AS avg_distance,
      AVG(r."timeMs")::float AS avg_time_ms
    ${ROUNDS_FROM(userId, mode)}
    WHERE ${PLAYED}
  `);

  const maxPossible = rounds.rounds_played * SCORE_CONFIG.maxPerRound;
  return {
    gamesPlayed: sessions.games_played,
    gamesCompleted: sessions.games_completed,
    roundsPlayed: rounds.rounds_played,
    roundsWon: rounds.rounds_won,
    totalScore: rounds.total_score,
    averageScore: Math.round(sessions.average_score),
    bestScore: sessions.best_score,
    accuracyPct:
      maxPossible > 0
        ? Math.round((rounds.total_score / maxPossible) * 100)
        : 0,
    averageDistance:
      rounds.avg_distance !== null ? Math.round(rounds.avg_distance) : null,
    averageTimeMs:
      rounds.avg_time_ms !== null ? Math.round(rounds.avg_time_ms) : null,
    perfects: rounds.perfects,
    wrongMaps: rounds.wrong_maps,
    wrongFloors: rounds.wrong_floors,
  };
}

/** « Sur quelle map suis-je mauvais ? » — triées de la pire à la meilleure. */
async function getMapStats(
  userId: string,
  mode: GameMode | null,
): Promise<MapStatsEntry[]> {
  const rows = await prisma.$queryRaw<
    {
      map_id: string;
      map_name: string;
      games: number;
      rounds: number;
      avg_score: number;
      best_score: number;
      avg_distance: number | null;
      won: number;
    }[]
  >(Prisma.sql`
    SELECT
      m.id AS map_id,
      m.name AS map_name,
      COUNT(DISTINCT g.id)::int AS games,
      COUNT(*)::int AS rounds,
      AVG(COALESCE(r.score, 0))::float AS avg_score,
      MAX(COALESCE(r.score, 0))::int AS best_score,
      AVG(r.distance)::float AS avg_distance,
      COUNT(*) FILTER (WHERE r."guessFloorId" = s."floorId")::int AS won
    ${ROUNDS_FROM(userId, mode)}
    WHERE ${PLAYED}
    GROUP BY m.id, m.name
    ORDER BY AVG(r.score) ASC
  `);

  return rows.map((row) => ({
    mapId: row.map_id,
    mapName: row.map_name,
    gamesPlayed: row.games,
    roundsPlayed: row.rounds,
    averageScore: Math.round(row.avg_score),
    bestScore: row.best_score,
    accuracyPct: Math.round((row.avg_score / SCORE_CONFIG.maxPerRound) * 100),
    averageDistance:
      row.avg_distance !== null ? Math.round(row.avg_distance) : null,
    winRatePct: Math.round((row.won / row.rounds) * 100),
  }));
}

/** « Est-ce que je me trompe souvent de niveau ? » — par étage réel. */
async function getFloorStats(
  userId: string,
  mode: GameMode | null,
): Promise<FloorStatsEntry[]> {
  const rows = await prisma.$queryRaw<
    {
      floor_id: string;
      map_name: string;
      floor_name: string;
      level: number;
      rounds: number;
      avg_score: number;
      avg_distance: number | null;
      won: number;
      wrong_floor: number;
    }[]
  >(Prisma.sql`
    SELECT
      f.id AS floor_id,
      m.name AS map_name,
      f.name AS floor_name,
      f.level,
      COUNT(*)::int AS rounds,
      AVG(COALESCE(r.score, 0))::float AS avg_score,
      AVG(r.distance)::float AS avg_distance,
      COUNT(*) FILTER (WHERE r."guessFloorId" = s."floorId")::int AS won,
      COUNT(*) FILTER (
        WHERE gf."mapId" = s."mapId" AND r."guessFloorId" <> s."floorId"
      )::int AS wrong_floor
    ${ROUNDS_FROM(userId, mode)}
    JOIN "Floor" f ON f.id = s."floorId"
    WHERE ${PLAYED}
    GROUP BY f.id, m.name, f.name, f.level
    ORDER BY m.name ASC, f.level ASC
  `);

  return rows.map((row) => ({
    floorId: row.floor_id,
    mapName: row.map_name,
    floorName: row.floor_name,
    level: row.level,
    roundsPlayed: row.rounds,
    averageScore: Math.round(row.avg_score),
    accuracyPct: Math.round((row.avg_score / SCORE_CONFIG.maxPerRound) * 100),
    averageDistance:
      row.avg_distance !== null ? Math.round(row.avg_distance) : null,
    winRatePct: Math.round((row.won / row.rounds) * 100),
    wrongFloorPct: Math.round((row.wrong_floor / row.rounds) * 100),
  }));
}

/** Les 30 dernières parties terminées, en ordre chronologique. */
async function getProgression(
  userId: string,
  mode: GameMode | null,
): Promise<ProgressionPoint[]> {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      completed_at: Date;
      score: number;
      rounds: number;
    }[]
  >(Prisma.sql`
    SELECT g.id, g."completedAt" AS completed_at, g.score,
      (SELECT COUNT(*)::int FROM "Round" r WHERE r."sessionId" = g.id) AS rounds
    FROM "GameSession" g
    WHERE g."userId" = ${userId} AND g.status = 'COMPLETED' ${MODE_FILTER(mode)}
    ORDER BY g."completedAt" DESC
    LIMIT 30
  `);

  return rows.reverse().map((row) => ({
    sessionId: row.id,
    completedAt: row.completed_at.toISOString(),
    score: row.score,
    accuracyPct: Math.round(
      (row.score / (row.rounds * SCORE_CONFIG.maxPerRound)) * 100,
    ),
  }));
}

/** Les 20 dernières parties terminées (historique cliquable). */
async function getHistory(
  userId: string,
  mode: GameMode | null,
): Promise<HistoryEntry[]> {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      completed_at: Date;
      started_at: Date;
      score: number;
      mode: string;
      rounds: number;
      map_names: string[];
    }[]
  >(Prisma.sql`
    SELECT g.id, g."completedAt" AS completed_at, g."startedAt" AS started_at,
      g.score, g.mode,
      COUNT(r.id)::int AS rounds,
      ARRAY_AGG(DISTINCT m.name ORDER BY m.name) AS map_names
    FROM "GameSession" g
    JOIN "Round" r ON r."sessionId" = g.id
    JOIN "Screenshot" s ON s.id = r."screenshotId"
    JOIN "GameMap" m ON m.id = s."mapId"
    WHERE g."userId" = ${userId} AND g.status = 'COMPLETED' ${MODE_FILTER(mode)}
    GROUP BY g.id
    ORDER BY g."completedAt" DESC
    LIMIT 20
  `);

  return rows.map((row) => {
    const maxScore = row.rounds * SCORE_CONFIG.maxPerRound;
    return {
      sessionId: row.id,
      completedAt: row.completed_at.toISOString(),
      score: row.score,
      mode: row.mode as GameMode,
      maxScore,
      accuracyPct: maxScore > 0 ? Math.round((row.score / maxScore) * 100) : 0,
      durationMs: row.completed_at.getTime() - row.started_at.getTime(),
      mapNames: row.map_names,
    };
  });
}

/** Étages où le joueur a joué (sélecteur de la heatmap). */
async function getHeatmapFloors(userId: string): Promise<HeatmapFloor[]> {
  const rows = await prisma.$queryRaw<
    {
      floor_id: string;
      map_name: string;
      floor_name: string;
      rounds: number;
    }[]
  >(Prisma.sql`
    SELECT f.id AS floor_id, m.name AS map_name, f.name AS floor_name,
      COUNT(*)::int AS rounds
    ${ROUNDS_FROM(userId, null)}
    JOIN "Floor" f ON f.id = s."floorId"
    WHERE ${PLAYED}
    GROUP BY f.id, m.name, f.name, f.level
    ORDER BY m.name ASC, f.level ASC
  `);

  return rows.map((row) => ({
    floorId: row.floor_id,
    mapName: row.map_name,
    floorName: row.floor_name,
    roundsPlayed: row.rounds,
  }));
}

/**
 * Tout ce qu'affiche la page statistiques, en un appel serveur.
 * Chaque sous-requête est un index scan borné au joueur — pas de
 * recalcul global, pas de duplication.
 */
export async function getPlayerStatistics(
  userId: string,
  mode: GameMode | null = null,
): Promise<PlayerStatistics> {
  const [overview, maps, floors, progression, history, heatmapFloors] =
    await Promise.all([
      getOverview(userId, mode),
      getMapStats(userId, mode),
      getFloorStats(userId, mode),
      getProgression(userId, mode),
      getHistory(userId, mode),
      getHeatmapFloors(userId),
    ]);

  return {
    overview,
    maps,
    floors,
    progression,
    history,
    heatmapFloors,
    maxPerRound: SCORE_CONFIG.maxPerRound,
  };
}

/**
 * Heatmap des erreurs d'un étage : les manches jouées y sont projetées
 * à la POSITION RÉELLE du screenshot, pondérées par la gravité de
 * l'erreur (0 = parfait, 1 = manche perdue). Le client ne rend qu'une
 * liste de points (canvas) — jamais les images des screenshots.
 */
export async function getHeatmap(
  userId: string,
  floorId: string,
): Promise<HeatmapData | null> {
  const floor = await prisma.floor.findUnique({
    where: { id: floorId },
    include: { map: { select: { name: true } } },
  });
  if (!floor) return null;

  const rows = await prisma.$queryRaw<
    { x: number; y: number; score: number }[]
  >(Prisma.sql`
    SELECT s."pixelX" AS x, s."pixelY" AS y, r.score
    ${ROUNDS_FROM(userId, null)}
    WHERE ${PLAYED} AND s."floorId" = ${floorId}
      AND s."pixelX" IS NOT NULL AND s."pixelY" IS NOT NULL
  `);

  return {
    floor: {
      id: floor.id,
      name: floor.name,
      mapName: floor.map.name,
      assetPath: floor.assetPath,
      width: floor.width,
      height: floor.height,
    },
    points: rows.map((row) => ({
      x: row.x,
      y: row.y,
      weight: 1 - row.score / SCORE_CONFIG.maxPerRound,
    })),
  };
}

/** Relecture d'une partie terminée — réservée à son propriétaire. */
export async function getSessionDetail(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      rounds: {
        orderBy: { index: "asc" },
        include: {
          screenshot: { include: { floor: true, map: true } },
        },
      },
    },
  });
  if (!session || session.userId !== userId) return null;

  const guessFloorIds = [
    ...new Set(
      session.rounds
        .map((r) => r.guessFloorId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const guessFloors = await prisma.floor.findMany({
    where: { id: { in: guessFloorIds } },
    include: { map: { select: { name: true } } },
  });
  const floorsById = new Map(guessFloors.map((f) => [f.id, f]));

  const rounds: SessionDetailRound[] = session.rounds
    .filter(
      (r) =>
        (r.guessFloorId !== null || r.timedOut) && r.screenshot.floor !== null,
    )
    .map((round) => {
      const guessFloor = floorsById.get(round.guessFloorId as string) ?? null;
      const actualFloor = round.screenshot.floor as NonNullable<
        typeof round.screenshot.floor
      >;
      const mapCorrect = guessFloor?.mapId === round.screenshot.mapId;
      const floorCorrect =
        mapCorrect && guessFloor?.id === round.screenshot.floorId;
      return {
        index: round.index,
        imageUrl: `/api/game/round-image/${round.id}`,
        actualMapName: round.screenshot.map.name,
        actualFloorName: actualFloor.name,
        floorAssetPath: actualFloor.assetPath,
        floorWidth: actualFloor.width,
        floorHeight: actualFloor.height,
        actualX: round.screenshot.pixelX ?? 0,
        actualY: round.screenshot.pixelY ?? 0,
        guessMapName: guessFloor?.map.name ?? "—",
        guessFloorName: guessFloor?.name ?? "—",
        guessX: floorCorrect ? round.guessX : null,
        guessY: floorCorrect ? round.guessY : null,
        mapCorrect,
        floorCorrect,
        distance: round.distance,
        score: round.score ?? 0,
        timeMs: round.timeMs,
      };
    });

  const maxScore = session.rounds.length * SCORE_CONFIG.maxPerRound;
  return {
    sessionId: session.id,
    completedAt: session.completedAt?.toISOString() ?? null,
    mode: session.mode,
    score: session.score,
    maxScore,
    accuracyPct:
      maxScore > 0 ? Math.round((session.score / maxScore) * 100) : 0,
    durationMs: session.completedAt
      ? session.completedAt.getTime() - session.startedAt.getTime()
      : null,
    rounds,
  };
}
