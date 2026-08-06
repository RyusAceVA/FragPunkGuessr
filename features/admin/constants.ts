import type { Difficulty } from "@/types";

/**
 * Style d'un pin / d'une pastille selon la difficulté.
 * `pin` : couleur de remplissage du pin SVG — `dot` : pastille Tailwind.
 */
export interface PinStyle {
  dot: string;
  pin: string;
  label: string;
}

export const UNSET_STYLE: PinStyle = {
  dot: "bg-slate-200",
  pin: "#e2e8f0",
  label: "Non renseigné",
};

export const DIFFICULTY_STYLES: Record<Difficulty, PinStyle> = {
  EASY: { dot: "bg-emerald-400", pin: "#34d399", label: "Facile" },
  MEDIUM: { dot: "bg-yellow-400", pin: "#facc15", label: "Moyen" },
  HARD: { dot: "bg-orange-400", pin: "#fb923c", label: "Difficile" },
  IMPOSSIBLE: { dot: "bg-red-500", pin: "#ef4444", label: "Impossible" },
};

export function difficultyStyle(difficulty: Difficulty | null): PinStyle {
  return difficulty ? DIFFICULTY_STYLES[difficulty] : UNSET_STYLE;
}

/** Couleurs d'état des pins (priorité sur la difficulté). */
export const PIN_SELECTED_COLOR = "#3b82f6"; // 🔵 sélectionné
export const PIN_EDITING_COLOR = "#a855f7"; // 🟣 en cours d'édition (drag)

/** En-deçà de ce déplacement (px écran), un geste est un clic, pas un drag. */
export const CLICK_MOVE_THRESHOLD = 4;

/** Deux screenshots placés à moins de N px (image) → avertissement. */
export const PROXIMITY_WARNING_DISTANCE = 15;

/** Zoom (scale) minimal pour afficher les miniatures sur le plan. */
export const THUMBNAIL_MIN_SCALE = 1.2;
