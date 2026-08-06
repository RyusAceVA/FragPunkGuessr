"use client";

import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";

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
 * (Les noms de maps ne sont jamais traduits.)
 */
export function MapPicker({ maps, isLoading, onPick }: MapPickerProps) {
  const t = useTranslations("play.panel");

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
      <p className="text-xs text-muted-foreground">{t("question")}</p>
      {maps.map((map) => (
        <button
          key={map.id}
          type="button"
          onClick={() => onPick(map)}
          className="clip-notch-sm panel flex w-full items-center gap-3 p-2 text-left transition-colors hover:border-primary/60 hover:bg-accent/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- plan servi par l'API d'assets */}
          <img
            src={assetUrl(map.floors[0].assetPath)}
            alt=""
            className="h-16 w-24 shrink-0 rounded-sm bg-black/40 object-cover opacity-80"
            loading="lazy"
            decoding="async"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-heading text-base font-bold tracking-wide uppercase">
              {map.name}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="size-3" aria-hidden />
              {t("floors", { count: map.floors.length })}
            </span>
          </span>
        </button>
      ))}
      {maps.length === 0 && (
        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
