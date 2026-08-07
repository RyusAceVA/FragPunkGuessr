import { GAME_CONFIG } from "../config";
import { pickRandomScreenshots } from "../server/random-screenshot";
import type { GameModeDefinition } from "./types";

/**
 * CLASSIC — le mode historique : N manches tirées au hasard sur
 * TOUTES les maps. Reconnaître la map fait partie du défi.
 */
export const classicMode: GameModeDefinition = {
  config: {
    id: "CLASSIC",
    roundsPerSession: GAME_CONFIG.roundsPerSession,
    timeLimitMsPerRound: null,
    requiresMap: false,
  },
  rounds: {
    pickScreenshots: (count) => pickRandomScreenshots(count),
  },
  validateOptions: async () => {
    // Aucune option : rien à valider
  },
};
