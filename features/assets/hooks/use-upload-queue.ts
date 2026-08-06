"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import type { UploadKind } from "../schemas";
import type { UploadResponse } from "../types";

export type UploadStatus = "pending" | "uploading" | "done" | "error";

export interface UploadItem {
  id: number;
  fileName: string;
  status: UploadStatus;
  /** Résultat ("1F", "0001"…) ou message d'erreur */
  message?: string;
  warning?: string;
}

const CONCURRENCY = 3;

/**
 * File d'upload : N fichiers, 3 transferts simultanés, un état par
 * fichier (progression, erreurs détaillées, avertissements). Chaque
 * fichier part dans sa propre requête — un échec n'affecte jamais les
 * autres, aucune perte silencieuse.
 */
export function useUploadQueue(mapId: string, kind: UploadKind) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const nextIdRef = useRef(1);

  const updateItem = useCallback((id: number, patch: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const start = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || isUploading) return;

      const queued = files.map((file) => ({
        id: nextIdRef.current++,
        file,
        item: {
          id: 0,
          fileName: file.name,
          status: "pending" as UploadStatus,
        },
      }));
      queued.forEach((q) => (q.item.id = q.id));
      setItems(queued.map((q) => q.item));
      setIsUploading(true);

      let cursor = 0;
      async function worker() {
        while (cursor < queued.length) {
          const entry = queued[cursor++];
          updateItem(entry.id, { status: "uploading" });
          try {
            const formData = new FormData();
            formData.set("mapId", mapId);
            formData.set("kind", kind);
            formData.set("file", entry.file);
            const response = await fetch("/api/admin/assets/upload", {
              method: "POST",
              body: formData,
            });
            const body = (await response
              .json()
              .catch(() => null)) as UploadResponse | null;
            if (response.ok && body?.ok) {
              updateItem(entry.id, {
                status: "done",
                message: body.label,
                warning: body.warning,
              });
            } else {
              updateItem(entry.id, {
                status: "error",
                message: body?.error ?? `Erreur ${response.status}`,
              });
            }
          } catch {
            updateItem(entry.id, {
              status: "error",
              message: "Erreur réseau — fichier non transféré",
            });
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, queued.length) }, worker),
      );

      setIsUploading(false);
      // Compteurs de maps + listes de screenshots impactés
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    [isUploading, kind, mapId, queryClient, updateItem],
  );

  const reset = useCallback(() => setItems([]), []);

  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return {
    items,
    start,
    reset,
    isUploading,
    total: items.length,
    doneCount,
    errorCount,
  };
}
