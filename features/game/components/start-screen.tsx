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
    <div className="corner-bands relative grid h-full items-center overflow-x-hidden overflow-y-auto px-4 py-8 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
      <div
        className="bg-grid mask-fade-edges vignette-grape absolute inset-0"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center sm:space-y-8 lg:text-left">
        <FadeIn>
          <h1 className="display text-5xl text-balance sm:text-7xl">
            {t("titleA")}
            <br />
            <span className="text-holo">{t("titleB")}</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mx-auto max-w-md text-sm text-balance text-muted-foreground sm:text-base lg:mx-0">
            {t("subtitle", { rounds: GAME_CONFIG.roundsPerSession })}
          </p>
        </FadeIn>
        <FadeIn delay={0.18}>
          <span className="cta-shards inline-flex">
            <Button
              size="xl"
              className="px-10"
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
