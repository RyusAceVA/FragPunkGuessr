"use client";

import { Layers } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { assetUrl } from "@/lib/assets";

import type { PlayableMap } from "../types";

interface MapPickerProps {
  maps: PlayableMap[];
  isLoading: boolean;
  onPick: (map: PlayableMap) => void;
}

/**
 * Étape 1 du guess : identifier la map. La liste montre les plans —
 * c'est volontaire, reconnaître le layout fait partie du jeu.
 */
export function MapPicker({ maps, isLoading, onPick }: MapPickerProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
      <p className="text-xs text-muted-foreground">
        Sur quelle map ce screenshot a-t-il été pris ?
      </p>
      {maps.map((map) => (
        <button
          key={map.id}
          type="button"
          onClick={() => onPick(map)}
          className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left transition-colors hover:border-primary/50 hover:bg-accent/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- plan servi par l'API d'assets */}
          <img
            src={assetUrl(map.floors[0].assetPath)}
            alt=""
            className="h-16 w-24 shrink-0 rounded-md bg-black/40 object-cover opacity-80"
            loading="lazy"
            decoding="async"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-heading text-sm font-semibold">
              {map.name}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="size-3" aria-hidden />
              {map.floors.length} étage{map.floors.length > 1 ? "s" : ""}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
