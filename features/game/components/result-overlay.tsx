"use client";

import { motion } from "framer-motion";
import { ArrowRight, ListOrdered, Loader2 } from "lucide-react";

import { MapPin } from "@/components/map-pin";
import { Button } from "@/components/ui/button";
import { usePanZoom } from "@/hooks/use-pan-zoom";
import { assetUrl } from "@/lib/assets";

import { ACTUAL_PIN_COLOR, PLAYER_PIN_COLOR } from "../constants";
import type { RoundResult } from "../types";

/** Pin statique ancré par sa pointe dans la couche zoomée. */
function AnchoredPin({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <span className="absolute" style={{ left: x, top: y, width: 0, height: 0 }}>
      <span
        className="relative block"
        style={{
          transform: "scale(calc(1 / var(--zoom, 1)))",
          transformOrigin: "0 0",
        }}
      >
        <span className="absolute" style={{ left: -14, top: -35 }}>
          <MapPin color={color} glow />
        </span>
      </span>
    </span>
  );
}

/**
 * Plan du résultat : toujours le VRAI plan avec la vraie position ;
 * le pin du joueur et la ligne n'apparaissent que si la manche est
 * gagnable (bonne map + bon étage).
 */
function ResultMap({ result }: { result: RoundResult }) {
  const { actual } = result;
  const { setContainerEl, contentRef, fit, containerHandlers } = usePanZoom({
    contentWidth: actual.floorWidth,
    contentHeight: actual.floorHeight,
  });

  const showGuess = result.floorCorrect;

  return (
    <div
      ref={setContainerEl}
      {...containerHandlers}
      className="bg-grid relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden rounded-xl border border-border select-none"
      data-testid="result-map"
    >
      <div
        ref={contentRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: actual.floorWidth, height: actual.floorHeight }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- plan rendu à taille native dans la couche zoomée */}
        <img
          src={assetUrl(actual.floorAssetPath)}
          alt={`Plan ${actual.floorName}`}
          width={actual.floorWidth}
          height={actual.floorHeight}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full"
          onLoad={fit}
        />

        {showGuess && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={actual.floorWidth}
            height={actual.floorHeight}
            viewBox={`0 0 ${actual.floorWidth} ${actual.floorHeight}`}
            aria-hidden
          >
            <motion.line
              x1={result.guess.x}
              y1={result.guess.y}
              x2={actual.x}
              y2={actual.y}
              stroke="white"
              strokeWidth={2}
              strokeDasharray="8 6"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeInOut" }}
            />
          </svg>
        )}

        {showGuess && (
          <AnchoredPin
            x={result.guess.x}
            y={result.guess.y}
            color={PLAYER_PIN_COLOR}
          />
        )}
        <AnchoredPin x={actual.x} y={actual.y} color={ACTUAL_PIN_COLOR} />
      </div>

      <span className="glass absolute top-2 left-2 z-10 rounded-full px-2.5 py-1 text-xs text-muted-foreground">
        {actual.mapName} · {actual.floorName}
      </span>
    </div>
  );
}

/** Cartouche de verdict selon le cas : mauvaise map / mauvais étage / distance. */
function Verdict({ result }: { result: RoundResult }) {
  if (!result.mapCorrect) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="font-heading text-xl font-bold text-destructive">
          Mauvaise map
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          La bonne map était :{" "}
          <span className="font-semibold text-foreground">
            {result.actual.mapName}
          </span>
          <br />
          Tu as répondu {result.guess.mapName}.
        </p>
      </div>
    );
  }
  if (!result.floorCorrect) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="font-heading text-xl font-bold text-destructive">
          Mauvais étage
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Bonne map, mais c&apos;était{" "}
          <span className="font-semibold text-foreground">
            {result.actual.floorName}
          </span>{" "}
          — tu as répondu {result.guess.floorName}.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center">
      <p className="text-xs tracking-widest text-muted-foreground uppercase">
        Distance
      </p>
      <p className="mt-1 font-heading text-4xl font-bold tabular-nums">
        {result.distance}
        <span className="ml-1.5 text-lg font-medium text-muted-foreground">
          pixels
        </span>
      </p>
    </div>
  );
}

interface ResultOverlayProps {
  result: RoundResult;
  screenshotUrl: string;
  onNext: () => void;
}

/** Fin de manche : verdict, vrai plan, screenshot, manche suivante. */
export function ResultOverlay({
  result,
  screenshotUrl,
  onNext,
}: ResultOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-40 bg-background/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 p-4 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <ResultMap result={result} />
        </div>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex w-full shrink-0 flex-col gap-4 lg:w-80"
        >
          <Verdict result={result} />

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element -- image servie par l'id de manche */}
            <img
              src={screenshotUrl}
              alt="Screenshot de la manche"
              className="aspect-video w-full bg-black/50 object-contain"
              decoding="async"
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: ACTUAL_PIN_COLOR }}
                aria-hidden
              />
              Vraie position
            </span>
            {result.floorCorrect && (
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: PLAYER_PIN_COLOR }}
                  aria-hidden
                />
                Ton pin
              </span>
            )}
          </div>

          <div className="mt-auto">
            <Button className="glow-primary w-full" size="lg" onClick={onNext}>
              {result.isLastRound ? (
                <>
                  <ListOrdered data-icon="inline-start" />
                  Voir le récapitulatif
                </>
              ) : (
                <>
                  <ArrowRight data-icon="inline-start" />
                  Manche suivante
                </>
              )}
            </Button>
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}

export function ResultLoading() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
    </div>
  );
}
