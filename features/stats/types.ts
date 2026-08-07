/**
 * DTO du moteur de statistiques. Tout est calculé par le
 * StatisticsService (server/statistics.ts) à partir de GameSession et
 * Round — aucune donnée dupliquée, aucun calcul dans les composants.
 */

/** Statistiques globales du joueur. */
export interface StatsOverview {
  gamesPlayed: number;
  gamesCompleted: number;
  roundsPlayed: number;
  roundsWon: number;
  totalScore: number;
  /** Score moyen par partie terminée */
  averageScore: number;
  /** Meilleur score sur une partie terminée */
  bestScore: number;
  /** Score total / score maximal possible, en % (0–100) */
  accuracyPct: number;
  /** Distance moyenne en pixels (manches gagnées uniquement) */
  averageDistance: number | null;
  /** Temps de réponse moyen en millisecondes (manches mesurées) */
  averageTimeMs: number | null;
  /** Manches à 5000 points */
  perfects: number;
  wrongMaps: number;
  wrongFloors: number;
}

/** Ligne « par map » — la map RÉELLE du screenshot joué. */
export interface MapStatsEntry {
  mapId: string;
  mapName: string;
  gamesPlayed: number;
  roundsPlayed: number;
  averageScore: number;
  bestScore: number;
  accuracyPct: number;
  averageDistance: number | null;
  /** Bonne map + bon étage, en % des manches jouées */
  winRatePct: number;
}

/** Ligne « par étage » — l'étage RÉEL du screenshot joué. */
export interface FloorStatsEntry {
  floorId: string;
  mapName: string;
  floorName: string;
  level: number;
  roundsPlayed: number;
  averageScore: number;
  accuracyPct: number;
  averageDistance: number | null;
  winRatePct: number;
  /** Bonne map mais mauvais étage, en % des manches jouées */
  wrongFloorPct: number;
}

/** Un point de l'évolution (une partie terminée). */
export interface ProgressionPoint {
  sessionId: string;
  completedAt: string;
  score: number;
  accuracyPct: number;
}

/** Une partie de l'historique. */
export interface HistoryEntry {
  sessionId: string;
  completedAt: string;
  score: number;
  maxScore: number;
  accuracyPct: number;
  durationMs: number;
  mapNames: string[];
}

/** Étage proposé dans le sélecteur de heatmap. */
export interface HeatmapFloor {
  floorId: string;
  mapName: string;
  floorName: string;
  roundsPlayed: number;
}

/** Réponse complète de la page statistiques. */
export interface PlayerStatistics {
  overview: StatsOverview;
  maps: MapStatsEntry[];
  floors: FloorStatsEntry[];
  progression: ProgressionPoint[];
  history: HistoryEntry[];
  heatmapFloors: HeatmapFloor[];
  maxPerRound: number;
}

/** Un point de heatmap : position réelle d'un screenshot joué. */
export interface HeatmapPoint {
  x: number;
  y: number;
  /** Gravité de l'erreur : 0 = parfait, 1 = manche perdue */
  weight: number;
}

export interface HeatmapData {
  floor: {
    id: string;
    name: string;
    mapName: string;
    assetPath: string;
    width: number;
    height: number;
  };
  points: HeatmapPoint[];
}

/** Une manche du détail d'une partie (relecture complète). */
export interface SessionDetailRound {
  index: number;
  imageUrl: string;
  actualMapName: string;
  actualFloorName: string;
  floorAssetPath: string;
  floorWidth: number;
  floorHeight: number;
  actualX: number;
  actualY: number;
  guessMapName: string;
  guessFloorName: string;
  /** Pin du joueur — affichable seulement si floorCorrect */
  guessX: number | null;
  guessY: number | null;
  mapCorrect: boolean;
  floorCorrect: boolean;
  distance: number | null;
  score: number;
  timeMs: number | null;
}

export interface SessionDetail {
  sessionId: string;
  completedAt: string | null;
  score: number;
  maxScore: number;
  accuracyPct: number;
  durationMs: number | null;
  rounds: SessionDetailRound[];
}
