import type { GameMode } from "@/types";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  Système de modes de jeu — contrats.
 *
 *  Le cœur du gameplay (sessions.ts) ne connaît AUCUN mode : il
 *  demande au registre (GameModeService) une définition et exécute
 *  ses deux contrats :
 *    · GameModeConfig  — les règles déclaratives du mode (manches,
 *      limite de temps, options exigées) ;
 *    · RoundGenerator  — comment tirer les screenshots des manches.
 *
 *  Ajouter un mode = créer un fichier qui implémente GameModeDefinition
 *  et l'enregistrer dans registry.ts. Zéro modification du cœur.
 * ═══════════════════════════════════════════════════════════════════
 */

/** Options fournies par le joueur à la création d'une partie. */
export interface GameModeOptions {
  /** Map imposée (Map Training) — id de GameMap */
  mapId?: string;
}

/** Contexte de création : qui joue (null = anonyme). */
export interface GameModeContext {
  userId: string | null;
}

/** Règles déclaratives d'un mode. */
export interface GameModeConfig {
  id: GameMode;
  /** Nombre de manches d'une partie de ce mode */
  roundsPerSession: number;
  /**
   * Limite de temps par manche en ms — null = aucune.
   * Déclaratif pour l'instant : l'application (compte à rebours côté
   * client, rejet côté serveur) arrivera avec Time Attack.
   */
  timeLimitMsPerRound: number | null;
  /** Le mode exige-t-il le choix d'une map (options.mapId) ? */
  requiresMap: boolean;
}

/** Tirage des screenshots d'une partie — le contrat central d'un mode. */
export interface RoundGenerator {
  /**
   * Renvoie les ids de screenshots des manches (distincts, jamais
   * deux fois le même dans une partie). Peut en renvoyer moins que
   * demandé si le pool est trop petit ; vide = partie impossible.
   */
  pickScreenshots(count: number, options: GameModeOptions): Promise<string[]>;
}

/** Un mode complet : règles + génération + validation des options. */
export interface GameModeDefinition {
  config: GameModeConfig;
  rounds: RoundGenerator;
  /**
   * Valide les options du joueur AVANT toute création (map existante,
   * connexion requise, tentative quotidienne unique…).
   * Lève une GameError explicite sinon.
   */
  validateOptions(
    options: GameModeOptions,
    context: GameModeContext,
  ): Promise<void>;
}
