import { ArrowLeft, Check, X } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { auth } from "@/features/auth";
import { getSessionDetail } from "@/features/stats/server/statistics";
import type { SessionDetailRound } from "@/features/stats/types";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stats.detail");
  return { title: t("metaTitle") };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function CheckOrCross({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="size-3.5 shrink-0 text-signal" aria-hidden />
  ) : (
    <X className="size-3.5 shrink-0 text-destructive" aria-hidden />
  );
}

/** Plan de l'étage réel avec la vraie position et le pin du joueur. */
function RoundMap({ round }: { round: SessionDetailRound }) {
  const r = Math.hypot(round.floorWidth, round.floorHeight) * 0.012;
  return (
    <div className="relative overflow-hidden bg-black/30">
      {/* eslint-disable-next-line @next/next/no-img-element -- plan servi par l'API d'assets */}
      <img
        src={assetUrl(round.floorAssetPath)}
        alt={`${round.actualMapName} · ${round.actualFloorName}`}
        width={round.floorWidth}
        height={round.floorHeight}
        loading="lazy"
        decoding="async"
        className="h-auto w-full opacity-90 select-none"
        draggable={false}
      />
      <svg
        viewBox={`0 0 ${round.floorWidth} ${round.floorHeight}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {round.guessX !== null && round.guessY !== null && (
          <>
            <line
              x1={round.guessX}
              y1={round.guessY}
              x2={round.actualX}
              y2={round.actualY}
              stroke="white"
              strokeWidth={r * 0.25}
              strokeDasharray={`${r * 0.8} ${r * 0.6}`}
              opacity={0.9}
            />
            <circle
              cx={round.guessX}
              cy={round.guessY}
              r={r}
              fill="var(--info)"
              stroke="black"
              strokeWidth={r * 0.25}
            />
          </>
        )}
        <circle
          cx={round.actualX}
          cy={round.actualY}
          r={r}
          fill="var(--signal)"
          stroke="black"
          strokeWidth={r * 0.25}
        />
      </svg>
    </div>
  );
}

/** Relecture d'une partie : chaque manche, plan et pins compris. */
export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const t = await getTranslations("stats.detail");
  const tModes = await getTranslations("modes");
  const format = await getFormatter();
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { sessionId } = await params;
  const detail = await getSessionDetail(session.user.id, sessionId);
  if (!detail) notFound();

  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/stats" />}
          >
            <ArrowLeft data-icon="inline-start" />
            {t("back")}
          </Button>
          <h1 className="display text-4xl sm:text-5xl">
            {t("title1")} <span className="text-holo">{t("title2")}</span>
          </h1>
          <span className="clip-slash inline-block bg-signal px-2.5 py-0.5 font-heading text-[11px] font-bold tracking-wider text-background uppercase">
            {tModes(detail.mode)}
          </span>
          {detail.completedAt && (
            <p className="text-sm text-muted-foreground">
              {format.dateTime(new Date(detail.completedAt), {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="panel clip-notch-sm px-4 py-2 text-center">
            <p className="display text-3xl text-signal tabular-nums">
              {detail.score}
            </p>
            <p className="overline-label text-muted-foreground">
              {t("score")} /{detail.maxScore}
            </p>
          </div>
          <div className="panel clip-notch-sm px-4 py-2 text-center">
            <p className="display text-3xl tabular-nums">
              {detail.accuracyPct}%
            </p>
            <p className="overline-label text-muted-foreground">
              {t("accuracy")}
            </p>
          </div>
          {detail.durationMs !== null && (
            <div className="panel clip-notch-sm px-4 py-2 text-center">
              <p className="display text-3xl tabular-nums">
                {formatDuration(detail.durationMs)}
              </p>
              <p className="overline-label text-muted-foreground">
                {t("duration")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {detail.rounds.map((round) => (
          <article
            key={round.index}
            className="panel clip-notch flex h-full flex-col overflow-hidden"
          >
            <div className="grid grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- image servie par l'id de manche */}
              <img
                src={round.imageUrl}
                alt={t("screenshotAlt", { index: round.index })}
                loading="lazy"
                decoding="async"
                className="h-full min-h-32 w-full bg-black/50 object-cover"
              />
              <RoundMap round={round} />
            </div>

            <div className="flex flex-1 items-center gap-3 p-3">
              <div className="min-w-0 flex-1 space-y-0.5 text-xs">
                <p className="font-heading text-sm font-bold tracking-wide uppercase">
                  {t("round", { index: round.index })}
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckOrCross ok={round.mapCorrect} />
                  <span className="truncate">
                    {t("map", { name: round.actualMapName })}
                    {!round.mapCorrect &&
                      t("answered", { name: round.guessMapName })}
                  </span>
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckOrCross ok={round.floorCorrect} />
                  <span className="truncate">
                    {t("floor", { name: round.actualFloorName })}
                    {round.mapCorrect &&
                      !round.floorCorrect &&
                      t("answered", { name: round.guessFloorName })}
                  </span>
                </p>
                {round.timeMs !== null && (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {t("time", { seconds: (round.timeMs / 1000).toFixed(1) })}
                  </p>
                )}
              </div>

              <div
                className={cn(
                  "clip-slash w-24 shrink-0 px-3 py-2 text-center",
                  round.score > 0 ? "bg-signal/15" : "bg-destructive/15",
                )}
              >
                <p
                  className={cn(
                    "display text-xl tabular-nums",
                    round.score > 0 ? "text-signal" : "text-destructive",
                  )}
                >
                  {round.score}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {round.distance !== null
                    ? t("distance", { distance: round.distance })
                    : t("lost")}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageContainer>
  );
}
