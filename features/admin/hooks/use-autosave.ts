"use client";

import { useCallback, useEffect, useRef } from "react";

import { useUpdateScreenshot } from "../api";
import type { UpdateScreenshotInput } from "../schemas";

type PendingInput = UpdateScreenshotInput & { zoneName?: string | null };

/**
 * Autosave d'un screenshot : accumule les champs modifiés puis envoie
 * un PATCH partiel après debounce. Garanties « jamais de perte » :
 *  - flush au démontage (changement de screenshot → le composant est
 *    remonté via `key`, le flush part avant)
 *  - flush `keepalive` si l'onglet se ferme avec des modifs en attente
 * Les champs sont fusionnés : deux modifications rapprochées partent
 * dans une seule requête.
 */
export function useAutosave(screenshotId: string, mapId: string) {
  const update = useUpdateScreenshot();
  const pendingRef = useRef<PendingInput>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutateRef = useRef(update.mutate);
  mutateRef.current = update.mutate;

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const { zoneName, ...input } = pendingRef.current;
    if (Object.keys(input).length === 0) return;
    pendingRef.current = {};
    mutateRef.current({ id: screenshotId, mapId, input, zoneName });
  }, [screenshotId, mapId]);

  const save = useCallback(
    (partial: PendingInput, delayMs = 600) => {
      Object.assign(pendingRef.current, partial);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (delayMs <= 0) {
        flush();
      } else {
        timerRef.current = setTimeout(flush, delayMs);
      }
    },
    [flush],
  );

  // Flush au démontage — rien ne reste en attente en changeant de screenshot
  useEffect(() => flush, [flush]);

  // Filet de sécurité : fermeture d'onglet / navigation dure
  useEffect(() => {
    function handlePageHide() {
      const input = { ...pendingRef.current };
      delete input.zoneName;
      if (Object.keys(input).length === 0) return;
      pendingRef.current = {};
      void fetch(`/api/admin/screenshots/${screenshotId}`, {
        method: "PATCH",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    }
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [screenshotId]);

  return { save, flush };
}
