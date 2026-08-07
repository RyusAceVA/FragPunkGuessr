import { GAME_CONFIG } from "../config";
import { pickRandomScreenshots } from "../server/random-screenshot";
import type { GameModeDefinition } from "./types";

/**
 * TIME_ATTACK — le mode Classic sous pression : 30 secondes par manche,
 * temps écoulé = manche perdue. La durée vit ICI et uniquement ici :
 * le gameplay la reçoit via le DTO de session (timeLimitMsPerRound),
 * il ne connaît jamais la valeur.
 */
export const timeAttackMode: GameModeDefinition = {
  config: {
    id: "TIME_ATTACK",
    roundsPerSession: GAME_CONFIG.roundsPerSession,
    timeLimitMsPerRound: 30_000,
    requiresMap: false,
  },
  rounds: {
    pickScreenshots: (count) => pickRandomScreenshots(count),
  },
  validateOptions: async () => {
    // Aucune option : rien à valider
  },
};
