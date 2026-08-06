"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { UpdateScreenshotInput } from "./schemas";
import type {
  AdminMap,
  AdminScreenshot,
  AdminTag,
  AdminZone,
  SyncSummary,
} from "./types";

/** Clés React Query du domaine admin. */
export const adminKeys = {
  maps: ["admin", "maps"] as const,
  tags: ["admin", "tags"] as const,
  screenshots: (mapId: string) => ["admin", "screenshots", mapId] as const,
};

/** Clé de mutation partagée — le SaveIndicator s'appuie dessus. */
export const UPDATE_SCREENSHOT_MUTATION_KEY = [
  "admin",
  "update-screenshot",
] as const;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useAdminMaps() {
  return useQuery({
    queryKey: adminKeys.maps,
    queryFn: () => fetchJson<AdminMap[]>("/api/admin/maps"),
  });
}

export function useAdminScreenshots(mapId: string | null) {
  return useQuery({
    queryKey: adminKeys.screenshots(mapId ?? ""),
    queryFn: () =>
      fetchJson<AdminScreenshot[]>(`/api/admin/screenshots?mapId=${mapId}`),
    enabled: mapId !== null,
  });
}

export function useAdminTags() {
  return useQuery({
    queryKey: adminKeys.tags,
    queryFn: () => fetchJson<AdminTag[]>("/api/admin/tags"),
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useSyncAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<SyncSummary>("/api/admin/sync", { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

interface UpdateScreenshotVariables {
  id: string;
  mapId: string;
  input: UpdateScreenshotInput;
  /** Nom de la zone correspondant à input.zoneId (affichage optimiste) */
  zoneName?: string | null;
}

/**
 * Mise à jour d'un screenshot (autosave) avec application optimiste :
 * l'UI reflète le changement instantanément, rollback si le serveur refuse.
 */
export function useUpdateScreenshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: UPDATE_SCREENSHOT_MUTATION_KEY,
    mutationFn: ({ id, input }: UpdateScreenshotVariables) =>
      fetchJson<AdminScreenshot>(
        `/api/admin/screenshots/${id}`,
        jsonInit("PATCH", input),
      ),

    onMutate: async ({ id, mapId, input, zoneName }) => {
      const key = adminKeys.screenshots(mapId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<AdminScreenshot[]>(key);

      queryClient.setQueryData<AdminScreenshot[]>(key, (list) =>
        list?.map((s) => {
          if (s.id !== id) return s;
          const next = { ...s };
          if (input.placement !== undefined) {
            next.floorId = input.placement?.floorId ?? null;
            next.pixelX = input.placement?.pixelX ?? null;
            next.pixelY = input.placement?.pixelY ?? null;
          }
          if (input.difficulty !== undefined)
            next.difficulty = input.difficulty;
          if (input.orientation !== undefined)
            next.orientation = input.orientation;
          if (input.zoneId !== undefined) {
            next.zoneId = input.zoneId;
            next.zoneName = zoneName ?? null;
          }
          if (input.notes !== undefined) next.notes = input.notes;
          if (input.tags !== undefined) next.tags = [...input.tags].sort();
          return next;
        }),
      );

      return { previous, key };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },

    onSettled: (_data, _error, { mapId, input }) => {
      void queryClient.invalidateQueries({
        queryKey: adminKeys.screenshots(mapId),
      });
      // Compteurs de la map (placés, zones) et usages de tags impactés
      if (input.placement !== undefined || input.zoneId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: adminKeys.maps });
      }
      if (input.tags !== undefined) {
        void queryClient.invalidateQueries({ queryKey: adminKeys.tags });
      }
    },
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { mapId: string; name: string }) =>
      fetchJson<AdminZone>("/api/admin/zones", jsonInit("POST", input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.maps });
    },
  });
}

export function useRenameZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      fetchJson<AdminZone>(
        `/api/admin/zones/${id}`,
        jsonInit("PATCH", { name }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      fetchJson<{ ok: boolean }>(`/api/admin/zones/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) =>
      fetchJson<AdminTag>("/api/admin/tags", jsonInit("POST", input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.tags });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      fetchJson<{ ok: boolean }>(`/api/admin/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
