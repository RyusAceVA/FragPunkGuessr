"use client";

import { useIsMutating, useMutationState } from "@tanstack/react-query";
import { Check, CloudUpload, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { UPDATE_SCREENSHOT_MUTATION_KEY } from "../api";

/**
 * État global de l'autosave, dérivé des mutations React Query :
 * « Enregistrement… » dès qu'un PATCH est en vol, puis « Sauvegardé »
 * ou « Erreur » selon l'issue de la dernière mutation.
 */
export function SaveIndicator() {
  const t = useTranslations("workshop");
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
        "overline-label flex items-center gap-1.5 transition-colors",
        state === "error" ? "text-destructive" : "text-muted-foreground",
        state === "saved" && "text-signal",
      )}
    >
      {state === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {t("saving")}
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="size-3.5" aria-hidden />
          {t("saved")}
        </>
      )}
      {state === "error" && (
        <>
          <TriangleAlert className="size-3.5" aria-hidden />
          {t("saveError")}
        </>
      )}
      {state === "idle" && (
        <>
          <CloudUpload className="size-3.5" aria-hidden />
          {t("autosave")}
        </>
      )}
    </span>
  );
}
