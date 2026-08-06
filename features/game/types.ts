/**
 * DTO du gameplay — pilotés serveur. Rien ne doit révéler la réponse
 * (map, étage, coordonnées, fichier) avant la validation d'une manche :
 * l'image d'une manche est servie par l'id du Round
 * (/api/game/round-image/[roundId]), jamais par son fichier.
 */

export interface GameFloor {
  id: string;
  name: string;
  level: number;
  assetPath: string;
  /** Dimensions du plan en pixels (référentiel des coordonnées) */
  width: number;
  height: number;
}

/** Map proposée dans le sélecteur du panneau de guess. */
export interface PlayableMap {
  id: string;
  slug: string;
  name: string;
  floors: GameFloor[];
  screenshotCount: number;
}

/** Une manche vue du client : un index et une image, rien d'autre. */
export interface SessionRound {
  id: string;
  index: number;
  imageUrl: string;
}

/** État d'une partie (GameSession côté client). */
export interface GameSessionState {
  id: string;
  roundCount: number;
  status: "IN_PROGRESS" | "COMPLETED";
  /** Prochaine manche à jouer (null si la partie est terminée) */
  currentRound: SessionRound | null;
}

/** Position réelle révélée après validation (plan compris, pour l'affichage). */
export interface RevealedPosition {
  mapName: string;
  floorName: string;
  floorAssetPath: string;
  floorWidth: number;
  floorHeight: number;
  x: number;
  y: number;
}

/** Verdict d'une manche (RoundResult). */
export interface RoundResult {
  roundId: string;
  index: number;
  mapCorrect: boolean;
  floorCorrect: boolean;
  /** Distance en pixels — null si mauvaise map ou mauvais étage */
  distance: number | null;
  actual: RevealedPosition;
  guess: {
    mapName: string;
    floorName: string;
    x: number;
    y: number;
  };
  isLastRound: boolean;
}

/** Réponse du serveur à un guess : le verdict + l'état de session à jour. */
export interface GuessResponse {
  result: RoundResult;
  session: GameSessionState;
}

/** Une ligne du récapitulatif de fin de partie (RoundHistory). */
export interface RoundHistoryEntry {
  index: number;
  imageUrl: string;
  actualMapName: string;
  guessMapName: string;
  actualFloorName: string;
  guessFloorName: string;
  mapCorrect: boolean;
  floorCorrect: boolean;
  distance: number | null;
}

export interface SessionSummary {
  sessionId: string;
  rounds: RoundHistoryEntry[];
}
