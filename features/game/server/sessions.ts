import { prisma } from "@/lib/prisma";

import { GAME_CONFIG } from "../config";
import type { SubmitGuessInput } from "../schemas";
import type {
  GameSessionState,
  GuessResponse,
  RoundHistoryEntry,
  SessionRound,
  SessionSummary,
} from "../types";
import { pickRandomScreenshots } from "./random-screenshot";

/** Erreur métier portant un statut HTTP, interceptée par les routes API. */
export class GameError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function roundImageUrl(roundId: string): string {
  return `/api/game/round-image/${roundId}`;
}

interface RoundLite {
  id: string;
  index: number;
  guessFloorId: string | null;
}

function serializeSession(
  sessionId: string,
  status: string,
  rounds: RoundLite[],
): GameSessionState {
  const ordered = [...rounds].sort((a, b) => a.index - b.index);
  const current = ordered.find((r) => r.guessFloorId === null) ?? null;
  const currentRound: SessionRound | null = current
    ? {
        id: current.id,
        index: current.index,
        imageUrl: roundImageUrl(current.id),
      }
    : null;
  return {
    id: sessionId,
    roundCount: ordered.length,
    status: status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
    currentRound,
  };
}

/**
 * Crée une partie : tire N screenshots DISTINCTS toutes maps confondues
 * (aucun doublon possible dans une partie, quel que soit le pool) et
 * matérialise les manches en base. Le client ne reçoit que les ids de
 * manches et l'image de la première.
 */
export async function createSession(): Promise<GameSessionState> {
  const screenshotIds = await pickRandomScreenshots(
    GAME_CONFIG.roundsPerSession,
  );
  if (screenshotIds.length === 0) {
    throw new GameError(409, "No playable screenshots — add content first");
  }

  const session = await prisma.gameSession.create({
    data: {
      mode: "CLASSIC",
      rounds: {
        create: screenshotIds.map((screenshotId, i) => ({
          screenshotId,
          index: i + 1,
        })),
      },
    },
    include: { rounds: true },
  });

  return serializeSession(session.id, session.status, session.rounds);
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

  const current = session.rounds.find((r) => r.guessFloorId === null);
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

  const guessFloor = await prisma.floor.findUnique({
    where: { id: input.floorId },
    include: { map: true },
  });
  if (!guessFloor) throw new GameError(400, "Unknown floor");

  const mapCorrect = guessFloor.mapId === screenshot.mapId;
  const floorCorrect = mapCorrect && guessFloor.id === screenshot.floorId;
  const distance = floorCorrect
    ? Math.round(
        Math.hypot(
          screenshot.pixelX - input.pixelX,
          screenshot.pixelY - input.pixelY,
        ),
      )
    : null;

  const isLastRound = current.index === session.rounds.length;

  await prisma.$transaction([
    prisma.round.update({
      where: { id: current.id },
      data: {
        guessFloorId: guessFloor.id,
        guessX: input.pixelX,
        guessY: input.pixelY,
        distance,
      },
    }),
    ...(isLastRound
      ? [
          prisma.gameSession.update({
            where: { id: session.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          }),
        ]
      : []),
  ]);

  const updatedRounds: RoundLite[] = session.rounds.map((r) =>
    r.id === current.id ? { ...r, guessFloorId: guessFloor.id } : r,
  );

  return {
    result: {
      roundId: current.id,
      index: current.index,
      mapCorrect,
      floorCorrect,
      distance,
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
        mapName: guessFloor.map.name,
        floorName: guessFloor.name,
        x: input.pixelX,
        y: input.pixelY,
      },
      isLastRound,
    },
    session: serializeSession(
      session.id,
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
    };
  });

  return { sessionId: session.id, rounds };
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
