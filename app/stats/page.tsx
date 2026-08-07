import { Flame, History, LineChart, LogIn, Map as MapIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GAME_MODES, type GameMode } from "@/types";
import { auth } from "@/features/auth";
import { GAME_CONFIG } from "@/features/game/config";
import {
  ErrorHeatmap,
  FloorStatsTable,
  HistoryList,
  MapStatsTable,
  OverviewGrid,
  ProgressionCharts,
} from "@/features/stats";
import { getPlayerStatistics } from "@/features/stats/server/statistics";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stats");
  return { title: t("meta") };
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-0.5">
      <h2 className="display flex items-center gap-2 text-2xl">
        <span className="clip-slash flex h-7 w-8 items-center justify-center bg-primary/15 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        {title}
      </h2>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/**
 * Tableau de bord du joueur connecté. Toutes les données viennent du
 * StatisticsService (agrégations SQL) — aucun calcul côté client.
 * ?mode=CLASSIC|MAP_TRAINING|… filtre toutes les statistiques par mode.
 */
export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const t = await getTranslations("stats");
  const tModes = await getTranslations("modes");
  const { mode: rawMode } = await searchParams;
  const mode: GameMode | null = (GAME_MODES as readonly string[]).includes(
    rawMode ?? "",
  )
    ? (rawMode as GameMode)
    : null;
  const session = await auth();

  if (!session?.user) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md space-y-5 py-16 text-center">
          <span className="clip-slash mx-auto flex size-14 items-center justify-center bg-primary text-primary-foreground">
            <LogIn className="size-7" aria-hidden />
          </span>
          <h1 className="display text-4xl">{t("signIn.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("signIn.description")}
          </p>
          <Button
            size="xl"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            {t("signIn.cta")}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const stats = await getPlayerStatistics(session.user.id, mode);
  const hasRounds = stats.overview.roundsPlayed > 0;

  return (
    <PageContainer>
      <div className="space-y-1.5">
        <h1 className="display text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      {/* Filtre par mode de jeu */}
      <nav className="flex flex-wrap gap-1.5" aria-label={t("title")}>
        {[null, ...GAME_MODES].map((tabMode) => {
          const active = mode === tabMode;
          return (
            <Link
              key={tabMode ?? "all"}
              href={tabMode ? `/stats?mode=${tabMode}` : "/stats"}
              className={cn(
                "clip-slash px-3.5 py-1.5 font-heading text-xs font-bold tracking-wider uppercase transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {tabMode ? tModes(tabMode) : t("tabs.all")}
            </Link>
          );
        })}
      </nav>

      {!hasRounds ? (
        <div className="panel clip-notch mx-auto max-w-md space-y-4 p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Button size="lg" nativeButton={false} render={<Link href="/play" />}>
            {t("playCta")}
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <OverviewGrid overview={stats.overview} />

          <section className="space-y-3">
            <SectionTitle icon={LineChart} title={t("charts.title")} />
            <ProgressionCharts
              progression={stats.progression}
              maxSessionScore={GAME_CONFIG.roundsPerSession * stats.maxPerRound}
            />
          </section>

          <section className="space-y-3">
            <SectionTitle
              icon={MapIcon}
              title={t("maps.title")}
              subtitle={t("maps.subtitle")}
            />
            <MapStatsTable maps={stats.maps} />
          </section>

          <section className="space-y-3">
            <SectionTitle
              icon={MapIcon}
              title={t("floors.title")}
              subtitle={t("floors.subtitle")}
            />
            <FloorStatsTable floors={stats.floors} />
          </section>

          <section className="space-y-3">
            <SectionTitle
              icon={Flame}
              title={t("heatmap.title")}
              subtitle={t("heatmap.subtitle")}
            />
            <ErrorHeatmap floors={stats.heatmapFloors} />
          </section>

          <section className="space-y-3">
            <SectionTitle
              icon={History}
              title={t("history.title")}
              subtitle={t("history.subtitle", {
                count: stats.history.length,
              })}
            />
            <HistoryList history={stats.history} />
          </section>
        </div>
      )}
    </PageContainer>
  );
}
