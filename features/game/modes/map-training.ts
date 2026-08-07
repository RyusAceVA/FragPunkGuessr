import { prisma } from "@/lib/prisma";

import { GAME_CONFIG } from "../config";
import { GameError } from "../server/errors";
import { pickRandomScreenshots } from "../server/random-screenshot";
import type { GameModeDefinition } from "./types";

/**
 * MAP_TRAINING — entraînement ciblé : le joueur choisit UNE map, le
 * tirage ne pioche que dans ses screenshots. La reconnaissance de map
 * disparaît du défi ; retrouver l'endroit exact reste entier.
 */
export const mapTrainingMode: GameModeDefinition = {
  config: {
    id: "MAP_TRAINING",
    roundsPerSession: GAME_CONFIG.roundsPerSession,
    timeLimitMsPerRound: null,
    requiresMap: true,
  },
  rounds: {
    pickScreenshots: (count, options) =>
      pickRandomScreenshots(count, { mapId: options.mapId }),
  },
  validateOptions: async (options) => {
    if (!options.mapId) {
      throw new GameError(400, "Map Training requires a map");
    }
    const map = await prisma.gameMap.findUnique({
      where: { id: options.mapId },
      select: { id: true },
    });
    if (!map) throw new GameError(404, "Map not found");
  },
};
