import { prisma } from "@/lib/prisma";

import { GAME_CONFIG } from "../config";
import { GameError } from "../server/errors";
import { dailySeed, pickRandomScreenshots } from "../server/random-screenshot";
import type { GameModeDefinition } from "./types";

/** Début du jour UTC courant — la frontière des défis. */
export function currentDailyWindowStart(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** La tentative du jour d'un joueur (peu importe son état), ou null. */
export async function findTodayDailySession(userId: string) {
  return prisma.gameSession.findFirst({
    where: {
      userId,
      mode: "DAILY",
      startedAt: { gte: currentDailyWindowStart() },
    },
    orderBy: { startedAt: "desc" },
  });
}

/**
 * DAILY — le défi quotidien : chaque jour UTC, les MÊMES screenshots
 * dans le MÊME ordre pour tout le monde (tirage seedé par la date sur
 * un pool trié — voir random-screenshot.ts), même score maximal.
 * UNE SEULE tentative par joueur et par jour : créer la partie consomme
 * la tentative, terminée ou non. Réservé aux joueurs connectés.
 */
export const dailyMode: GameModeDefinition = {
  config: {
    id: "DAILY",
    roundsPerSession: GAME_CONFIG.roundsPerSession,
    timeLimitMsPerRound: null,
    requiresMap: false,
  },
  rounds: {
    pickScreenshots: (count) =>
      pickRandomScreenshots(count, { seed: dailySeed() }),
  },
  validateOptions: async (_options, context) => {
    if (!context.userId) {
      throw new GameError(401, "Sign in to play the daily challenge");
    }
    const existing = await findTodayDailySession(context.userId);
    if (existing) {
      throw new GameError(409, "Daily challenge already played today");
    }
  },
};
