"use client";

import { ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { HistoryEntry } from "../types";

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Les 20 dernières parties — chaque ligne ouvre la relecture. */
export function HistoryList({ history }: { history: HistoryEntry[] }) {
  const t = useTranslations("stats.history");
  const format = useFormatter();

  if (history.length === 0) {
    return (
      <div className="panel clip-notch p-6 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry, i) => (
        <FadeIn key={entry.sessionId} delay={Math.min(i * 0.04, 0.3)}>
          <Link
            href={`/stats/${entry.sessionId}`}
            className="panel clip-notch-sm group flex items-center gap-4 p-3 transition-colors hover:border-primary/50"
          >
            <div className="w-28 shrink-0">
              <p className="font-heading text-sm font-bold uppercase">
                {format.dateTime(new Date(entry.completedAt), {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format.dateTime(new Date(entry.completedAt), {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1">
                {/* Noms de maps — jamais traduits */}
                {entry.mapNames.map((name) => (
                  <Badge key={name} variant="outline" className="text-[10px]">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="hidden w-16 text-right sm:block">
              <p className="font-mono text-sm tabular-nums">
                {formatDuration(entry.durationMs)}
              </p>
            </div>

            <div className="w-24 text-right">
              <p
                className={cn(
                  "display text-2xl tabular-nums",
                  entry.accuracyPct >= 70
                    ? "text-signal"
                    : entry.accuracyPct < 40
                      ? "text-destructive"
                      : "",
                )}
              >
                {entry.score}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {entry.accuracyPct}% · /{entry.maxScore}
              </p>
            </div>

            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </Link>
        </FadeIn>
      ))}
    </div>
  );
}
