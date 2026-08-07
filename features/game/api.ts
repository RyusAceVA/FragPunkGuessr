"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { fetchJson, jsonInit } from "@/lib/fetch-json";

import type { CreateSessionInput, SubmitGuessInput } from "./schemas";
import type {
  GameSessionState,
  GuessResponse,
  PlayableMap,
  SessionSummary,
} from "./types";

export const gameKeys = {
  maps: ["game", "maps"] as const,
  summary: (sessionId: string) => ["game", "summary", sessionId] as const,
};

/** Maps proposées dans le sélecteur du panneau de guess. */
export function usePlayableMaps() {
  return useQuery({
    queryKey: gameKeys.maps,
    queryFn: () => fetchJson<PlayableMap[]>("/api/game/maps"),
    staleTime: 60_000,
  });
}

export function useStartSession() {
  return useMutation({
    mutationFn: (input: CreateSessionInput) =>
      fetchJson<GameSessionState>("/api/game/session", jsonInit("POST", input)),
  });
}

export function useSubmitGuess() {
  return useMutation({
    mutationFn: ({
      sessionId,
      ...input
    }: SubmitGuessInput & { sessionId: string }) =>
      fetchJson<GuessResponse>(
        `/api/game/session/${sessionId}/guess`,
        jsonInit("POST", input),
      ),
  });
}

export function useSessionSummary(sessionId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: gameKeys.summary(sessionId ?? ""),
    queryFn: () =>
      fetchJson<SessionSummary>(`/api/game/session/${sessionId}/summary`),
    enabled: enabled && sessionId !== null,
  });
}
