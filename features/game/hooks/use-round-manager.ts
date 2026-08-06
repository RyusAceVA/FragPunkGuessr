"use client";

import { toast } from "sonner";

import { useStartSession, useSubmitGuess } from "../api";
import { useGameStore } from "../store";

/**
 * Chef d'orchestre d'une partie : relie les appels serveur au store.
 * C'est ici que se brancheront le score cumulé, les défis quotidiens
 * (seed) et les futurs modes de jeu.
 */
export function useRoundManager() {
  const store = useGameStore();
  const startSessionMutation = useStartSession();
  const submitGuessMutation = useSubmitGuess();

  /** Lance une nouvelle partie (depuis l'accueil ou le récapitulatif). */
  function startSession() {
    startSessionMutation.mutate(undefined, {
      onSuccess: (session) => store.beginSession(session),
      onError: (error) => toast.error(error.message),
    });
  }

  /** Valide la réponse de la manche courante (map + étage + pin requis). */
  function validateGuess() {
    const { session, currentRound, guessFloorId, pin } =
      useGameStore.getState();
    if (!session || !currentRound || !guessFloorId || !pin) return;
    submitGuessMutation.mutate(
      {
        sessionId: session.id,
        roundId: currentRound.id,
        floorId: guessFloorId,
        pixelX: pin.x,
        pixelY: pin.y,
      },
      {
        onSuccess: ({ result, session: updated }) =>
          store.showResult(result, updated),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return {
    startSession,
    validateGuess,
    isStartingSession: startSessionMutation.isPending,
    isValidating: submitGuessMutation.isPending,
  };
}
