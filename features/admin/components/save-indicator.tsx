"use client";

import { useIsMutating, useMutationState } from "@tanstack/react-query";
import { Check, CloudUpload, Loader2, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

import { UPDATE_SCREENSHOT_MUTATION_KEY } from "../api";

/**
 * État global de l'autosave, dérivé des mutations React Query :
 * « Enregistrement… » dès qu'un PATCH est en vol, puis « Sauvegardé »
 * ou « Erreur » selon l'issue de la dernière mutation.
 */
export function SaveIndicator() {
  const savingCount = useIsMutating({
    mutationKey: UPDATE_SCREENSHOT_MUTATION_KEY,
  });
  const statuses = useMutationState({
    filters: { mutationKey: UPDATE_SCREENSHOT_MUTATION_KEY },
    select: (mutation) => mutation.state.status,
  });
  const lastStatus = statuses[statuses.length - 1];

  const state =
    savingCount > 0
      ? "saving"
      : lastStatus === "error"
        ? "error"
        : lastStatus === "success"
          ? "saved"
          : "idle";

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 text-xs transition-colors",
        state === "error" ? "text-destructive" : "text-muted-foreground",
        state === "saved" && "text-emerald-400",
      )}
    >
      {state === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Enregistrement…
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="size-3.5" aria-hidden />
          Sauvegardé
        </>
      )}
      {state === "error" && (
        <>
          <TriangleAlert className="size-3.5" aria-hidden />
          Erreur — réessaie
        </>
      )}
      {state === "idle" && (
        <>
          <CloudUpload className="size-3.5" aria-hidden />
          Autosave
        </>
      )}
    </span>
  );
}
