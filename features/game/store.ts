import { create } from "zustand";

import type { GameSessionState, RoundResult, SessionRound } from "./types";

export type GamePhase = "idle" | "round" | "result" | "summary";

/**
 * État d'une partie côté client. Le serveur reste la seule vérité :
 * le store ne connaît de chaque manche que son id et son image, et
 * n'apprend la bonne map/étage/position qu'à travers un RoundResult.
 */
interface GameState {
  phase: GamePhase;
  session: GameSessionState | null;
  /** Manche affichée à l'écran (phase "round"/"result") */
  currentRound: SessionRound | null;
  result: RoundResult | null;

  /** Début de la manche affichée (image visible) — pour le temps de réponse */
  roundStartedAt: number | null;
  /** Panneau latéral de guess ouvert */
  panelOpen: boolean;
  /** Étape 1 du guess : map choisie par le joueur (null = liste des maps) */
  guessMapId: string | null;
  /** Étape 2 : étage choisi sur cette map */
  guessFloorId: string | null;
  /** Étape 3 : pin posé (pixels image du plan de l'étage choisi) */
  pin: { x: number; y: number } | null;

  beginSession: (session: GameSessionState) => void;
  markRoundStarted: () => void;
  setPanelOpen: (open: boolean) => void;
  selectGuessMap: (mapId: string, defaultFloorId: string | null) => void;
  clearGuessMap: () => void;
  selectGuessFloor: (floorId: string) => void;
  placePin: (x: number, y: number) => void;
  showResult: (result: RoundResult, session: GameSessionState) => void;
  /** Après le résultat : manche suivante ou récapitulatif */
  advance: () => void;
  backToIdle: () => void;
}

const EMPTY_GUESS = {
  panelOpen: false,
  guessMapId: null,
  guessFloorId: null,
  pin: null,
} as const;

export const useGameStore = create<GameState>()((set) => ({
  phase: "idle",
  session: null,
  currentRound: null,
  result: null,
  roundStartedAt: null,
  ...EMPTY_GUESS,

  beginSession: (session) =>
    set({
      phase: "round",
      session,
      currentRound: session.currentRound,
      result: null,
      roundStartedAt: null,
      ...EMPTY_GUESS,
    }),

  markRoundStarted: () => set({ roundStartedAt: Date.now() }),

  setPanelOpen: (open) => set({ panelOpen: open }),

  selectGuessMap: (mapId, defaultFloorId) =>
    set({ guessMapId: mapId, guessFloorId: defaultFloorId, pin: null }),

  clearGuessMap: () => set({ guessMapId: null, guessFloorId: null, pin: null }),

  selectGuessFloor: (floorId) =>
    set((state) =>
      state.guessFloorId === floorId
        ? state
        : // Changer d'étage invalide le pin : le joueur replace sa réponse
          { guessFloorId: floorId, pin: null },
    ),

  placePin: (x, y) => set({ pin: { x, y } }),

  showResult: (result, session) =>
    set({ phase: "result", result, session, panelOpen: false }),

  advance: () =>
    set((state) => {
      if (!state.session) return state;
      if (state.session.status === "COMPLETED") {
        return { ...state, phase: "summary" as const, result: null };
      }
      return {
        ...state,
        phase: "round" as const,
        currentRound: state.session.currentRound,
        result: null,
        roundStartedAt: null,
        ...EMPTY_GUESS,
      };
    }),

  backToIdle: () =>
    set({
      phase: "idle",
      session: null,
      currentRound: null,
      result: null,
      ...EMPTY_GUESS,
    }),
}));
