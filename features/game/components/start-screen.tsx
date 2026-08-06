"use client";

import { Loader2, Play } from "lucide-react";

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
  return (
    <div className="bg-grid mask-fade-edges relative flex h-full flex-col items-center justify-center gap-8 px-4 text-center">
      <div
        className="absolute top-1/4 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
        aria-hidden
      />
      <FadeIn>
        <div className="relative space-y-3">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Reconnais la map.
            <br />
            <span className="text-gradient-neon">Retrouve l&apos;endroit.</span>
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
            {GAME_CONFIG.roundsPerSession} manches. Un screenshot à chaque fois,
            sans indice : à toi de deviner la map, l&apos;étage et la position
            exacte.
          </p>
        </div>
      </FadeIn>
      <FadeIn delay={0.15}>
        <Button
          size="lg"
          className="glow-primary relative px-10 text-base"
          onClick={onStart}
          disabled={isStarting}
        >
          {isStarting ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Play data-icon="inline-start" />
          )}
          Lancer une partie
        </Button>
      </FadeIn>
    </div>
  );
}
