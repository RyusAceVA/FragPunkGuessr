"use client";

import { toast } from "sonner";

import type { CreateSessionInput } from "../schemas";
import { useStartSession, useSubmitGuess } from "../api";
import { useGameStore } from "../store";

/**
 * Chef d'orchestre d'une partie : relie les appels serveur au store.
 * Le mode de jeu n'est qu'un paramètre transmis au serveur — toute la
 * logique de mode vit dans features/game/modes (registre).
 */
export function useRoundManager() {
  const store = useGameStore();
  const startSessionMutation = useStartSession();
  const submitGuessMutation = useSubmitGuess();

  /**
   * Lance une partie. Sans argument (« Rejouer » du récapitulatif),
   * reprend le mode et les options de la partie précédente.
   */
  function startSession(input?: CreateSessionInput) {
    const resolved = input ??
      useGameStore.getState().createInput ?? { mode: "CLASSIC" as const };
    store.setCreateInput(resolved);
    startSessionMutation.mutate(resolved, {
      onSuccess: (session) => store.beginSession(session),
      onError: (error) => toast.error(error.message),
    });
  }

  /** Valide la réponse de la manche courante (map + étage + pin requis). */
  function validateGuess() {
    const { session, currentRound, guessFloorId, pin, roundStartedAt } =
      useGameStore.getState();
    if (!session || !currentRound || !guessFloorId || !pin) return;
    submitGuessMutation.mutate(
      {
        sessionId: session.id,
        roundId: currentRound.id,
        floorId: guessFloorId,
        pixelX: pin.x,
        pixelY: pin.y,
        // Temps de réponse (image affichée → validation), statistique
        timeMs:
          roundStartedAt !== null
            ? Math.max(0, Date.now() - roundStartedAt)
            : undefined,
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
