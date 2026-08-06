"use client";

import { Check, Home, Loader2, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useSessionSummary } from "../api";
import type { RoundHistoryEntry } from "../types";

function CheckOrCross({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="size-3.5 text-signal" aria-hidden />
  ) : (
    <X className="size-3.5 text-destructive" aria-hidden />
  );
}

function RoundRow({ entry }: { entry: RoundHistoryEntry }) {
  const t = useTranslations("play.summary");

  return (
    <div className="panel clip-notch-sm flex items-center gap-3 p-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- image servie par l'id de manche */}
      <img
        src={entry.imageUrl}
        alt={t("screenshotAlt", { index: entry.index })}
        className="h-14 w-24 shrink-0 rounded-sm bg-black/40 object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="min-w-0 flex-1 space-y-0.5 text-xs">
        <p className="font-heading text-sm font-bold tracking-wide uppercase">
          {t("round", { index: entry.index })}
        </p>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <CheckOrCross ok={entry.mapCorrect} />
          <span className="truncate">
            {t("map", { name: entry.actualMapName })}
            {!entry.mapCorrect && t("answered", { name: entry.guessMapName })}
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <CheckOrCross ok={entry.floorCorrect} />
          <span className="truncate">
            {t("floor", { name: entry.actualFloorName })}
            {entry.mapCorrect &&
              !entry.floorCorrect &&
              t("answered", { name: entry.guessFloorName })}
          </span>
        </p>
      </div>
      <div
        className={cn(
          "clip-slash shrink-0 px-3 py-2 text-center",
          entry.distance !== null ? "bg-signal/15" : "bg-destructive/15",
        )}
      >
        {entry.distance !== null ? (
          <>
            <p className="display text-xl text-signal tabular-nums">
              {entry.distance}
            </p>
            <p className="text-[10px] text-muted-foreground">{t("pixels")}</p>
          </>
        ) : (
          <p className="font-heading text-xs font-bold text-destructive uppercase italic">
            {t("lost")}
          </p>
        )}
      </div>
    </div>
  );
}

interface SummaryScreenProps {
  sessionId: string;
  isRestarting: boolean;
  onNewGame: () => void;
  onQuit: () => void;
}

/** Fin de partie : le récapitulatif des manches (RoundHistory). */
export function SummaryScreen({
  sessionId,
  isRestarting,
  onNewGame,
  onQuit,
}: SummaryScreenProps) {
  const t = useTranslations("play.summary");
  const summaryQuery = useSessionSummary(sessionId, true);
  const rounds = summaryQuery.data?.rounds ?? [];

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-y-auto px-4 py-8 sm:px-6">
      <FadeIn>
        <div className="space-y-1 text-center">
          <h1 className="display text-5xl">
            {t("title1")} <span className="text-primary">{t("title2")}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {rounds.length > 0 &&
              t("nailed", {
                correct: rounds.filter((r) => r.floorCorrect).length,
                total: rounds.length,
              })}
          </p>
        </div>
      </FadeIn>

      {summaryQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {rounds.map((entry, i) => (
            <FadeIn key={entry.index} delay={i * 0.07}>
              <RoundRow entry={entry} />
            </FadeIn>
          ))}
        </div>
      )}

      <FadeIn delay={0.3}>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            className="glow-primary flex-1"
            size="lg"
            onClick={onNewGame}
            disabled={isRestarting}
          >
            {isRestarting ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <RotateCcw data-icon="inline-start" />
            )}
            {t("newGame")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onQuit}
            disabled={isRestarting}
          >
            <Home data-icon="inline-start" />
            {t("backHome")}
          </Button>
        </div>
      </FadeIn>
    </div>
  );
}
