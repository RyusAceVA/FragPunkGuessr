import type { GameMode } from "@/types";

import { GameError } from "../server/errors";
import { classicMode } from "./classic";
import { mapTrainingMode } from "./map-training";
import type { GameModeDefinition } from "./types";

/**
 * GameModeService — le registre des modes JOUABLES.
 *
 * Ajouter un mode :
 *  1. déclarer son id dans GAME_MODES (types/game.ts) ;
 *  2. créer sa GameModeDefinition (ex. time-attack.ts) ;
 *  3. l'ajouter à PLAYABLE_MODES ci-dessous.
 * Le cœur du jeu (sessions.ts), les routes et les statistiques ne
 * changent pas. Un id déclaré mais absent d'ici (TIME_ATTACK) est
 * refusé à la création de partie mais reconnu partout ailleurs
 * (base, statistiques, i18n).
 */
const PLAYABLE_MODES: Partial<Record<GameMode, GameModeDefinition>> = {
  CLASSIC: classicMode,
  MAP_TRAINING: mapTrainingMode,
};

/** Définition d'un mode jouable — 400 si le mode n'est pas ouvert. */
export function getGameMode(id: GameMode): GameModeDefinition {
  const mode = PLAYABLE_MODES[id];
  if (!mode) {
    throw new GameError(400, `Game mode ${id} is not available yet`);
  }
  return mode;
}

/** Modes proposés au joueur (écran de démarrage). */
export function listGameModes(): GameModeDefinition[] {
  return Object.values(PLAYABLE_MODES);
}
