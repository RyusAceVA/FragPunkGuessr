"use client";

import { motion } from "framer-motion";
import { ArrowRight, ListOrdered, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
      className="bg-grid panel clip-notch relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden select-none"
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
          alt={actual.floorName}
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

      {/* Noms de map/étage — jamais traduits */}
      <span className="clip-slash absolute top-2 left-2 z-10 bg-foreground px-2.5 py-1 font-heading text-xs font-bold tracking-wider text-background uppercase">
        {actual.mapName} · {actual.floorName}
      </span>
    </div>
  );
}

/** Cartouche de verdict : mauvaise map / mauvais étage / distance. */
function Verdict({ result }: { result: RoundResult }) {
  const t = useTranslations("play.result");

  if (!result.mapCorrect) {
    return (
      <div className="panel clip-notch space-y-1 border-destructive/40 p-5 text-center">
        <p className="display text-3xl text-destructive">{t("wrongMap")}</p>
        <p className="text-sm text-muted-foreground">
          {t("wrongMapWas")}{" "}
          <span className="font-heading font-bold text-foreground uppercase">
            {result.actual.mapName}
          </span>
          <br />
          {t("youAnswered", { name: result.guess.mapName })}
        </p>
      </div>
    );
  }
  if (!result.floorCorrect) {
    return (
      <div className="panel clip-notch space-y-1 border-destructive/40 p-5 text-center">
        <p className="display text-3xl text-destructive">{t("wrongFloor")}</p>
        <p className="text-sm text-muted-foreground">
          {t("wrongFloorDetail", {
            actual: result.actual.floorName,
            guess: result.guess.floorName,
          })}
        </p>
      </div>
    );
  }
  return (
    <div className="panel clip-notch hard-shadow-signal p-5 text-center">
      <p className="overline-label text-muted-foreground">{t("distance")}</p>
      <p className="display mt-1 text-5xl tabular-nums">
        {result.distance}
        <span className="ml-1.5 text-xl text-muted-foreground">
          {t("pixels")}
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
  const t = useTranslations("play.result");

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

          <div className="panel clip-notch overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- image servie par l'id de manche */}
            <img
              src={screenshotUrl}
              alt={t("screenshotAlt")}
              className="aspect-video w-full bg-black/50 object-contain"
              decoding="async"
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2"
                style={{ background: ACTUAL_PIN_COLOR }}
                aria-hidden
              />
              {t("actualSpot")}
            </span>
            {result.floorCorrect && (
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2"
                  style={{ background: PLAYER_PIN_COLOR }}
                  aria-hidden
                />
                {t("yourPin")}
              </span>
            )}
          </div>

          <div className="mt-auto">
            <Button className="w-full" size="lg" onClick={onNext}>
              {result.isLastRound ? (
                <>
                  <ListOrdered data-icon="inline-start" />
                  {t("recap")}
                </>
              ) : (
                <>
                  <ArrowRight data-icon="inline-start" />
                  {t("next")}
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
