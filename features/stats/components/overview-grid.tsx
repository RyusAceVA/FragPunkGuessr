"use client";

import { useTranslations } from "next-intl";

import { FadeIn } from "@/components/motion/fade-in";

import type { StatsOverview } from "../types";

interface Tile {
  key: string;
  value: string;
  accent?: "signal" | "destructive" | "info";
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

/** Les 13 statistiques globales, en tuiles compactes. */
export function OverviewGrid({ overview }: { overview: StatsOverview }) {
  const t = useTranslations("stats.overview");

  const tiles: Tile[] = [
    { key: "gamesPlayed", value: String(overview.gamesPlayed) },
    { key: "gamesCompleted", value: String(overview.gamesCompleted) },
    { key: "roundsPlayed", value: String(overview.roundsPlayed) },
    { key: "roundsWon", value: String(overview.roundsWon), accent: "signal" },
    { key: "totalScore", value: String(overview.totalScore) },
    { key: "averageScore", value: String(overview.averageScore) },
    { key: "bestScore", value: String(overview.bestScore), accent: "signal" },
    { key: "accuracy", value: `${overview.accuracyPct}%`, accent: "info" },
    {
      key: "averageDistance",
      value:
        overview.averageDistance !== null
          ? `${overview.averageDistance} px`
          : "—",
    },
    {
      key: "averageTime",
      value:
        overview.averageTimeMs !== null
          ? formatSeconds(overview.averageTimeMs)
          : "—",
    },
    { key: "perfects", value: String(overview.perfects), accent: "signal" },
    {
      key: "wrongMaps",
      value: String(overview.wrongMaps),
      accent: "destructive",
    },
    {
      key: "wrongFloors",
      value: String(overview.wrongFloors),
      accent: "destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile, i) => (
        <FadeIn key={tile.key} delay={Math.min(i * 0.04, 0.3)}>
          <div className="panel clip-notch-sm h-full p-3">
            <p
              className={`display text-3xl tabular-nums ${
                tile.accent === "signal"
                  ? "text-signal"
                  : tile.accent === "destructive"
                    ? "text-destructive"
                    : tile.accent === "info"
                      ? "text-info"
                      : ""
              }`}
            >
              {tile.value}
            </p>
            <p className="overline-label mt-1 text-muted-foreground">
              {t(tile.key)}
            </p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}
