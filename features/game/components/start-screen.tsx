"use client";

import { Globe2, Loader2, Play, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Artwork } from "@/components/artwork";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { GameMode } from "@/types";

import { usePlayableMaps } from "../api";
import { GAME_CONFIG } from "../config";
import type { CreateSessionInput } from "../schemas";

interface StartScreenProps {
  isStarting: boolean;
  onStart: (input: CreateSessionInput) => void;
}

/** Modes proposés à l'écran (le serveur reste seul juge via le registre). */
const MODE_CHOICES = [
  { id: "CLASSIC" as GameMode, icon: Globe2 },
  { id: "MAP_TRAINING" as GameMode, icon: Target },
] as const;

/**
 * Début de partie : choix du mode (Classic / Map Training) puis
 * lancement. La logique des modes vit côté serveur (registre) — ici on
 * ne fait que transmettre le mode et ses options.
 */
export function StartScreen({ isStarting, onStart }: StartScreenProps) {
  const t = useTranslations("play.start");
  const tModes = useTranslations("modes");
  const [mode, setMode] = useState<GameMode>("CLASSIC");
  const [mapId, setMapId] = useState<string | null>(null);

  const mapsQuery = usePlayableMaps();
  const maps = mapsQuery.data ?? [];
  const mapItems = maps.map((map) => ({
    // Noms de maps — jamais traduits
    label: map.name,
    value: map.id,
  }));

  const needsMap = mode === "MAP_TRAINING";
  const canStart = !isStarting && (!needsMap || mapId !== null);

  return (
    <div className="corner-bands relative grid h-full items-center overflow-x-hidden overflow-y-auto px-4 py-8 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
      <div
        className="bg-grid mask-fade-edges vignette-grape absolute inset-0"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-2xl space-y-5 text-center sm:space-y-6 lg:text-left">
        <FadeIn>
          <h1 className="display text-5xl text-balance sm:text-6xl xl:text-7xl">
            {t("titleA")}
            <br />
            <span className="text-holo">{t("titleB")}</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.08}>
          <p className="mx-auto max-w-md text-sm text-balance text-muted-foreground sm:text-base lg:mx-0">
            {t("subtitle", { rounds: GAME_CONFIG.roundsPerSession })}
          </p>
        </FadeIn>

        {/* Choix du mode */}
        <FadeIn delay={0.14}>
          <div
            className="flex flex-col justify-center gap-2 sm:flex-row lg:justify-start"
            role="radiogroup"
            aria-label={t("modeLabel")}
          >
            {MODE_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={mode === choice.id}
                onClick={() => setMode(choice.id)}
                className={cn(
                  "panel clip-notch-sm flex-1 cursor-pointer p-3 text-left transition-colors sm:max-w-56",
                  mode === choice.id
                    ? "border-primary/70 bg-primary/10"
                    : "hover:border-foreground/30",
                )}
              >
                <span className="flex items-center gap-2">
                  <choice.icon
                    className={cn(
                      "size-4",
                      mode === choice.id
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="font-heading text-sm font-bold tracking-wide uppercase">
                    {tModes(choice.id)}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t(`modeDescriptions.${choice.id}`)}
                </span>
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Map Training : choix de la map */}
        {needsMap && (
          <FadeIn>
            <div className="flex justify-center lg:justify-start">
              <Select
                items={mapItems}
                value={mapId}
                onValueChange={(value) => setMapId(value as string)}
              >
                <SelectTrigger className="w-64" aria-label={t("mapLabel")}>
                  <SelectValue placeholder={t("mapPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {mapItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={0.2}>
          <span className="cta-shards inline-flex">
            <Button
              size="xl"
              className="px-10"
              onClick={() =>
                onStart({
                  mode,
                  mapId: needsMap ? (mapId ?? undefined) : undefined,
                })
              }
              disabled={!canStart}
            >
              {isStarting ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Play data-icon="inline-start" />
              )}
              {t("cta")}
            </Button>
          </span>
        </FadeIn>
      </div>

      {/* Slot d'illustration configurable (branding.json) */}
      <FadeIn delay={0.15} className="relative z-10 hidden h-full lg:block">
        <div className="absolute inset-0 flex items-end justify-center">
          <div
            className="absolute inset-x-8 bottom-0 h-3/5 -skew-x-3 bg-[linear-gradient(115deg,var(--grape),var(--grape-bright))] opacity-50"
            aria-hidden
          />
          <Artwork
            slot="play.start"
            className="relative h-[85%] w-full"
            imgClassName="object-contain object-bottom"
          />
        </div>
      </FadeIn>
    </div>
  );
}
