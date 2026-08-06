"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchJson, jsonInit } from "@/lib/fetch-json";

import type { CreateAssetsMapInput } from "./schemas";
import type { AssetsMap, AssetsStatus } from "./types";

export const assetsKeys = {
  maps: ["admin", "maps"] as const, // même cache que l'atelier
  status: ["assets", "status"] as const,
};

/** Les maps (même API HTTP que l'atelier — cache partagé). */
export function useAssetsMaps() {
  return useQuery({
    queryKey: assetsKeys.maps,
    queryFn: () => fetchJson<AssetsMap[]>("/api/admin/maps"),
  });
}

export function useAssetsStatus() {
  return useQuery({
    queryKey: assetsKeys.status,
    queryFn: () => fetchJson<AssetsStatus>("/api/admin/assets/status"),
    staleTime: 5 * 60_000,
  });
}

export function useCreateAssetsMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssetsMapInput) =>
      fetchJson<{ id: string; name: string; assetDir: string }>(
        "/api/admin/assets/maps",
        jsonInit("POST", input),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetsKeys.maps });
    },
  });
}
