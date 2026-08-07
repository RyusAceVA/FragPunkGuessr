import { prisma } from "@/lib/prisma";
import { maxSessionScore, SCORE_CONFIG, scoreRound } from "@/lib/score";

import { getGameMode, getGameModeConfig } from "../modes/registry";
import type { GameModeOptions } from "../modes/types";
import type { CreateSessionInput, SubmitGuessInput } from "../schemas";
import type {
  GameSessionState,
  GuessResponse,
  RoundHistoryEntry,
  SessionRound,
  SessionSummary,
} from "../types";

import { GameError } from "./errors";

export { GameError };

function roundImageUrl(roundId: string): string {
  return `/api/game/round-image/${roundId}`;
}

interface RoundLite {
  id: string;
  index: number;
  guessFloorId: string | null;
  timedOut: boolean;
}

/** Une manche est jouée si elle a une réponse OU si son temps a expiré. */
function isPlayed(round: RoundLite): boolean {
  return round.guessFloorId !== null || round.timedOut;
}

function serializeSession(
  sessionId: string,
  mode: string,
  status: string,
  rounds: RoundLite[],
): GameSessionState {
  const ordered = [...rounds].sort((a, b) => a.index - b.index);
  const current = ordered.find((r) => !isPlayed(r)) ?? null;
  const currentRound: SessionRound | null = current
    ? {
        id: current.id,
        index: current.index,
        imageUrl: roundImageUrl(current.id),
      }
    : null;
  return {
    id: sessionId,
    mode,
    roundCount: ordered.length,
    status: status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
    currentRound,
    // La limite de temps vient de la CONFIG du mode — le gameplay ne
    // connaît jamais la durée, il applique ce que le DTO annonce.
    timeLimitMsPerRound: getGameModeConfig(mode)?.timeLimitMsPerRound ?? null,
  };
}

/**
 * SessionGenerator — crée une partie de N'IMPORTE QUEL mode jouable.
 * Le cœur ne connaît aucun mode : il résout la définition via le
 * registre (GameModeService), valide les options du joueur, délègue
 * le tirage des screenshots au RoundGenerator du mode (toujours
 * DISTINCTS — aucun doublon dans une partie) et matérialise les
 * manches en base. Le client ne reçoit que les ids de manches et
 * l'image de la première.
 *
 * `userId` (joueur connecté) rattache la partie à un profil pour les
 * statistiques ; null = partie anonyme, jamais comptée dans un profil.
 */
export async function createSession(
  userId: string | null,
  input: CreateSessionInput,
): Promise<GameSessionState> {
  const mode = getGameMode(input.mode);
  const options: GameModeOptions = { mapId: input.mapId };
  await mode.validateOptions(options, { userId });

  const screenshotIds = await mode.rounds.pickScreenshots(
    mode.config.roundsPerSession,
    options,
  );
  if (screenshotIds.length === 0) {
    throw new GameError(409, "No playable screenshots — add content first");
  }

  // Un JWT peut survivre à la suppression du compte (12 h) : un userId
  // inconnu est traité comme une partie anonyme, jamais comme une erreur.
  const owner = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })
    : null;

  const session = await prisma.gameSession.create({
    data: {
      mode: mode.config.id,
      userId: owner?.id ?? null,
      rounds: {
        create: screenshotIds.map((screenshotId, i) => ({
          screenshotId,
          index: i + 1,
        })),
      },
    },
    include: { rounds: true },
  });

  return serializeSession(
    session.id,
    session.mode,
    session.status,
    session.rounds,
  );
}

/**
 * Évalue le guess de la manche courante. Toute la vérité (map, étage,
 * coordonnées) reste ici : elle n'est révélée qu'en retour de validation.
 */
export async function submitGuess(
  sessionId: string,
  input: SubmitGuessInput,
): Promise<GuessResponse> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { rounds: { orderBy: { index: "asc" } } },
  });
  if (!session) throw new GameError(404, "Match not found");
  if (session.status === "COMPLETED") {
    throw new GameError(409, "This match is already over");
  }

  const current = session.rounds.find(
    (r) => r.guessFloorId === null && !r.timedOut,
  );
  if (!current || current.id !== input.roundId) {
    throw new GameError(409, "This round is not the current round");
  }

  const screenshot = await prisma.screenshot.findUnique({
    where: { id: current.screenshotId },
    include: { floor: true, map: true },
  });
  if (
    !screenshot?.floor ||
    screenshot.pixelX === null ||
    screenshot.pixelY === null
  ) {
    throw new GameError(409, "Corrupted round — the screenshot was moved");
  }

  // Temps de réponse client, clampé à 30 min
  const timeMs =
    input.timeMs !== undefined ? Math.min(input.timeMs, 30 * 60_000) : null;

  /*
   * Modes chronométrés : la manche expire (flag client, ou garde
   * serveur si le temps annoncé dépasse la limite du mode + marge
   * réseau). La limite vient de la CONFIG du mode — jamais d'ici.
   */
  const timeLimitMs =
    getGameModeConfig(session.mode)?.timeLimitMsPerRound ?? null;
  const timedOut =
    timeLimitMs !== null &&
    (input.timedOut === true ||
      (timeMs !== null && timeMs > timeLimitMs + 2000));

  let mapCorrect = false;
  let floorCorrect = false;
  let distance: number | null = null;
  let guessFloor: {
    id: string;
    name: string;
    map: { name: string };
  } | null = null;
  let guessX: number | null = null;
  let guessY: number | null = null;

  if (!timedOut) {
    if (
      input.floorId === undefined ||
      input.pixelX === undefined ||
      input.pixelY === undefined
    ) {
      throw new GameError(400, "Invalid request");
    }
    const floor = await prisma.floor.findUnique({
      where: { id: input.floorId },
      include: { map: true },
    });
    if (!floor) throw new GameError(400, "Unknown floor");

    guessFloor = floor;
    guessX = input.pixelX;
    guessY = input.pixelY;
    mapCorrect = floor.mapId === screenshot.mapId;
    floorCorrect = mapCorrect && floor.id === screenshot.floorId;
    distance = floorCorrect
      ? Math.round(
          Math.hypot(
            screenshot.pixelX - input.pixelX,
            screenshot.pixelY - input.pixelY,
          ),
        )
      : null;
  }

  // Score de la manche — délégué au ScoreService (lib/score.ts)
  const score = scoreRound({
    mapCorrect,
    floorCorrect,
    distancePx: distance,
    planWidth: screenshot.floor.width,
    planHeight: screenshot.floor.height,
  });
  const totalScore = session.score + score;

  const isLastRound = current.index === session.rounds.length;
  const completedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.round.update({
      where: { id: current.id },
      data: {
        guessFloorId: guessFloor?.id ?? null,
        guessX,
        guessY,
        timedOut,
        distance,
        score,
        timeMs,
      },
    });
    await tx.gameSession.update({
      where: { id: session.id },
      data: {
        score: totalScore,
        ...(isLastRound ? { status: "COMPLETED", completedAt } : {}),
      },
    });

    /*
     * Cache incrémental UserStats (joueur connecté uniquement) : les
     * compteurs cumulables sont mis à jour au fil de l'eau — jamais de
     * recalcul complet. La source de vérité reste Round/GameSession
     * (le StatisticsService y lit les statistiques détaillées) ;
     * UserStats servira aux lectures O(1) inter-joueurs (classements).
     */
    if (session.userId) {
      const perfect = score === SCORE_CONFIG.maxPerRound ? 1 : 0;
      const playTimeMs = timeMs ?? 0;
      await tx.userStats.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          roundsPlayed: 1,
          totalScore: score,
          perfectGuesses: perfect,
          playTimeMs,
          ...(isLastRound
            ? {
                gamesPlayed: 1,
                bestScore: totalScore,
                averageScore: totalScore,
              }
            : {}),
        },
        update: {
          roundsPlayed: { increment: 1 },
          totalScore: { increment: score },
          perfectGuesses: { increment: perfect },
          playTimeMs: { increment: playTimeMs },
        },
      });
      if (isLastRound) {
        // Moyenne et record sur les parties TERMINÉES uniquement
        const agg = await tx.gameSession.aggregate({
          where: { userId: session.userId, status: "COMPLETED" },
          _count: { _all: true },
          _avg: { score: true },
          _max: { score: true },
        });
        await tx.userStats.update({
          where: { userId: session.userId },
          data: {
            gamesPlayed: agg._count._all,
            averageScore: agg._avg.score ?? 0,
            bestScore: agg._max.score ?? 0,
          },
        });
      }
    }
  });

  const updatedRounds: RoundLite[] = session.rounds.map((r) =>
    r.id === current.id
      ? { ...r, guessFloorId: guessFloor?.id ?? null, timedOut }
      : r,
  );

  return {
    result: {
      roundId: current.id,
      index: current.index,
      roundCount: session.rounds.length,
      mapCorrect,
      floorCorrect,
      timedOut,
      distance,
      score,
      totalScore,
      maxPerRound: SCORE_CONFIG.maxPerRound,
      actual: {
        mapName: screenshot.map.name,
        floorName: screenshot.floor.name,
        floorAssetPath: screenshot.floor.assetPath,
        floorWidth: screenshot.floor.width,
        floorHeight: screenshot.floor.height,
        x: screenshot.pixelX,
        y: screenshot.pixelY,
      },
      guess: {
        mapName: guessFloor?.map.name ?? "—",
        floorName: guessFloor?.name ?? "—",
        x: guessX ?? 0,
        y: guessY ?? 0,
      },
      isLastRound,
    },
    session: serializeSession(
      session.id,
      session.mode,
      isLastRound ? "COMPLETED" : session.status,
      updatedRounds,
    ),
  };
}

/** Récapitulatif de fin de partie (RoundHistory). */
export async function getSessionSummary(
  sessionId: string,
): Promise<SessionSummary> {
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
  if (!session) throw new GameError(404, "Match not found");
  if (session.status !== "COMPLETED") {
    throw new GameError(409, "The match is not finished yet");
  }

  const guessFloorIds = [
    ...new Set(
      session.rounds
        .map((r) => r.guessFloorId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const guessFloors = await prisma.floor.findMany({
    where: { id: { in: guessFloorIds } },
    include: { map: true },
  });
  const floorsById = new Map(guessFloors.map((f) => [f.id, f]));

  const rounds: RoundHistoryEntry[] = session.rounds.map((round) => {
    const guessFloor = round.guessFloorId
      ? (floorsById.get(round.guessFloorId) ?? null)
      : null;
    const mapCorrect = guessFloor?.mapId === round.screenshot.mapId;
    return {
      index: round.index,
      imageUrl: roundImageUrl(round.id),
      actualMapName: round.screenshot.map.name,
      guessMapName: guessFloor?.map.name ?? "—",
      actualFloorName: round.screenshot.floor?.name ?? "—",
      guessFloorName: guessFloor?.name ?? "—",
      mapCorrect,
      floorCorrect: mapCorrect && guessFloor?.id === round.screenshot.floorId,
      distance: round.distance,
      score: round.score ?? 0,
    };
  });

  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const maxScore = maxSessionScore(rounds.length);

  return {
    sessionId: session.id,
    rounds,
    totalScore,
    maxScore,
    /** Moyenne des ratios score/max, en % (0–100) */
    accuracyPct: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    nailedCount: rounds.filter((r) => r.floorCorrect).length,
  };
}

/** Chemin du fichier image d'une manche (servi par l'id du Round). */
export async function getRoundImagePath(
  roundId: string,
): Promise<string | null> {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    select: { screenshot: { select: { assetPath: true } } },
  });
  return round?.screenshot.assetPath ?? null;
}
