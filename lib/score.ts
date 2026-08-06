/**
 * ═══════════════════════════════════════════════════════════════════
 *  ScoreService — calcul du score d'une manche.
 *
 *  TOTALEMENT indépendant du gameplay : fonctions pures, aucun accès
 *  base/réseau. Le gameplay fournit un verdict + une distance + les
 *  dimensions du plan, et reçoit un entier. Changer la formule = ne
 *  toucher qu'à ce fichier (SCORE_CONFIG, ou une courbe ci-dessous).
 *
 *  ÉQUITÉ — la distance brute en pixels dépend de la résolution du
 *  plan (un même écart réel vaut 80 px sur un plan 1024² et 300 px
 *  sur un plan 4096²). On normalise donc par la DIAGONALE du plan :
 *      d = distance / √(largeur² + hauteur²)   ∈ [0, 1]
 *  d est sans unité : 0 = pin exact, 1 = erreur d'un coin à l'autre.
 *  Le score ne dépend ainsi ni de la résolution, ni des dimensions,
 *  ni du format du plan — uniquement de l'erreur RELATIVE à la map.
 *
 *  COURBES — trois décroissances non linéaires sont fournies :
 *
 *  · "gaussian" (RETENUE) : ratio = exp(−(d/σ)²)
 *      Plateau naturel près de 0 (dérivée nulle en d=0 : être à
 *      20 px ne coûte presque rien, sans seuil arbitraire), chute
 *      maximale dans la zone médiane (c'est là qu'on départage les
 *      joueurs), queue asymptotique vers 0 (jamais négatif). Un seul
 *      paramètre (σ).
 *
 *  · "graceExp" : ratio = 1 si d ≤ grace, sinon exp(−k·(d−grace))
 *      Zone de grâce explicite puis exponentielle (esprit GeoGuessr).
 *      Lisible, mais la transition au bord de la grâce est anguleuse
 *      et la pente est maximale juste après — elle punit davantage
 *      les « presque parfaits » que la gaussienne.
 *
 *  · "exp" : ratio = exp(−k·d)
 *      La plus simple, mais sa pente est MAXIMALE en d=0 : quelques
 *      pixels d'écart coûtent immédiatement des points — contraire à
 *      l'exigence « à 20 px on ne perd presque rien ».
 *
 *  Barème gaussien (σ = 0.25), exemple sur un plan de diagonale
 *  2000 px — les ratios sont identiques sur N'IMPORTE QUEL plan :
 *      20 px  (d=0.01) → 4992
 *      100 px (d=0.05) → 4804
 *      200 px (d=0.10) → 4261
 *      400 px (d=0.20) → 2636
 *      600 px (d=0.30) → 1185
 *     1000 px (d=0.50) →   92
 *     ≥ 1400 px        →  ~0
 * ═══════════════════════════════════════════════════════════════════
 */

export type ScoreCurve = "gaussian" | "graceExp" | "exp";

export const SCORE_CONFIG = {
  /** Score maximal d'une manche (partie = roundCount × maxPerRound). */
  maxPerRound: 5000,
  /** Courbe de décroissance active. */
  curve: "gaussian" as ScoreCurve,
  /** gaussian — écart-type, en fraction de la diagonale du plan. */
  sigma: 0.25,
  /** graceExp — rayon de la zone de grâce, en fraction de diagonale. */
  grace: 0.02,
  /** graceExp / exp — raideur de la décroissance. */
  falloff: 8,
} as const;

/** ratio ∈ [0, 1] pour une distance normalisée d ∈ [0, +∞). */
const CURVES: Record<ScoreCurve, (d: number) => number> = {
  gaussian: (d) => Math.exp(-((d / SCORE_CONFIG.sigma) ** 2)),
  graceExp: (d) =>
    d <= SCORE_CONFIG.grace
      ? 1
      : Math.exp(-SCORE_CONFIG.falloff * (d - SCORE_CONFIG.grace)),
  exp: (d) => Math.exp(-SCORE_CONFIG.falloff * d),
};

/** Distance sans unité : fraction de la diagonale du plan (0 = exact). */
export function normalizedDistance(
  distancePx: number,
  planWidth: number,
  planHeight: number,
): number {
  const diagonal = Math.hypot(planWidth, planHeight);
  return diagonal > 0 ? distancePx / diagonal : 1;
}

export interface RoundScoreInput {
  mapCorrect: boolean;
  floorCorrect: boolean;
  /** Distance en pixels sur le plan de l'étage réel (null = manche perdue). */
  distancePx: number | null;
  /** Dimensions du plan de l'étage réel, en pixels. */
  planWidth: number;
  planHeight: number;
}

/**
 * Score d'une manche : 0 si mauvaise map ou mauvais étage, sinon
 * maxPerRound × courbe(distance normalisée), arrondi à l'entier.
 */
export function scoreRound(input: RoundScoreInput): number {
  if (!input.mapCorrect || !input.floorCorrect || input.distancePx === null) {
    return 0;
  }
  const d = Math.max(
    0,
    normalizedDistance(input.distancePx, input.planWidth, input.planHeight),
  );
  const ratio = CURVES[SCORE_CONFIG.curve](d);
  return Math.round(SCORE_CONFIG.maxPerRound * Math.min(1, Math.max(0, ratio)));
}

/** Score maximal théorique d'une partie de N manches. */
export function maxSessionScore(roundCount: number): number {
  return roundCount * SCORE_CONFIG.maxPerRound;
}
