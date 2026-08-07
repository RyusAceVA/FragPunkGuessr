import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { auth } from "@/features/auth";
import { LeaderboardTable } from "@/features/leaderboard/components/leaderboard-table";
import { getLeaderboard } from "@/features/leaderboard/server/leaderboards";
import {
  LEADERBOARD_PERIODS,
  type LeaderboardPeriod,
} from "@/features/leaderboard/types";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("leaderboard");
  return { title: t("meta") };
}

/**
 * Classements publics — meilleure partie terminée par joueur.
 * ?period=daily|weekly|monthly|alltime (le paramètre mode du service
 * est prêt pour les futurs classements par mode de jeu).
 */
export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const t = await getTranslations("leaderboard");
  const { period: rawPeriod } = await searchParams;
  const period: LeaderboardPeriod = (
    LEADERBOARD_PERIODS as readonly string[]
  ).includes(rawPeriod ?? "")
    ? (rawPeriod as LeaderboardPeriod)
    : "alltime";

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const data = await getLeaderboard({ period, userId: currentUserId });

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="space-y-1.5">
          <h1 className="display text-4xl sm:text-5xl">
            {t("title1")} <span className="text-holo">{t("title2")}</span>
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <nav className="flex flex-wrap gap-1.5" aria-label={t("meta")}>
          {LEADERBOARD_PERIODS.map((tab) => (
            <Link
              key={tab}
              href={
                tab === "alltime"
                  ? "/leaderboards"
                  : `/leaderboards?period=${tab}`
              }
              className={cn(
                "clip-slash px-3.5 py-1.5 font-heading text-xs font-bold tracking-wider uppercase transition-colors",
                period === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t(`periods.${tab}`)}
            </Link>
          ))}
        </nav>

        <LeaderboardTable data={data} currentUserId={currentUserId} />
      </div>
    </PageContainer>
  );
}
