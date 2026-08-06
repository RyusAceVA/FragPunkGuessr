"use client";

import { Loader2, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Artwork } from "@/components/artwork";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";

import { GAME_CONFIG } from "../config";

interface StartScreenProps {
  isStarting: boolean;
  onStart: () => void;
}

/**
 * Début de partie : un seul bouton. Le joueur ne choisit rien —
 * reconnaître la map fait partie du défi.
 */
export function StartScreen({ isStarting, onStart }: StartScreenProps) {
  const t = useTranslations("play.start");

  return (
    <div className="bg-grid mask-fade-edges relative grid h-full items-center overflow-hidden px-4 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative z-10 mx-auto max-w-2xl space-y-8 text-center lg:text-left">
        <FadeIn>
          <h1 className="display text-5xl text-balance sm:text-7xl">
            {t("titleA")}
            <br />
            <span className="text-primary">{t("titleB")}</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mx-auto max-w-md text-sm text-balance text-muted-foreground sm:text-base lg:mx-0">
            {t("subtitle", { rounds: GAME_CONFIG.roundsPerSession })}
          </p>
        </FadeIn>
        <FadeIn delay={0.18}>
          <Button
            size="lg"
            className="glow-primary px-10 text-base"
            onClick={onStart}
            disabled={isStarting}
          >
            {isStarting ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Play data-icon="inline-start" />
            )}
            {t("cta")}
          </Button>
        </FadeIn>
      </div>

      {/* Slot d'illustration configurable (branding.json) */}
      <FadeIn delay={0.15} className="hidden h-full lg:block">
        <div className="relative flex h-full items-end">
          <div
            className="stripes-primary absolute inset-x-0 top-1/4 bottom-0 -skew-x-6 opacity-10"
            aria-hidden
          />
          <Artwork slot="play.start" className="relative h-4/5 w-full" />
        </div>
      </FadeIn>
    </div>
  );
}
