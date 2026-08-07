import {
  CalendarClock,
  Hourglass,
  ListOrdered,
  LogIn,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { auth } from "@/features/auth";
import { DailyCountdown } from "@/features/game/components/daily-countdown";
import { DailyStartButton } from "@/features/game/components/daily-start-button";
import { findTodayDailySession } from "@/features/game/modes/daily";
import { LeaderboardTable } from "@/features/leaderboard/components/leaderboard-table";
import { getLeaderboard } from "@/features/leaderboard/server/leaderboards";
import { GAME_CONFIG } from "@/features/game/config";
import { maxSessionScore } from "@/lib/score";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("daily");
  return { title: t("meta") };
}

function CountdownCard({ label }: { label: string }) {
  return (
    <div className="panel clip-notch-sm flex items-center justify-center gap-3 px-5 py-3">
      <Hourglass className="size-4 text-info" aria-hidden />
      <span className="overline-label text-muted-foreground">{label}</span>
      <DailyCountdown className="font-mono text-lg font-bold text-info tabular-nums" />
    </div>
  );
}

/**
 * Défi du jour : mêmes screenshots pour tout le monde (tirage seedé
 * par la date UTC), une seule tentative par joueur. Le classement du
 * jour réutilise le LeaderboardService avec mode=DAILY.
 */
export default async function DailyPage() {
  const t = await getTranslations("daily");
  const session = await auth();
  const maxScore = maxSessionScore(GAME_CONFIG.roundsPerSession);

  // Non connecté : le défi exige un compte (une tentative par joueur)
  if (!session?.user) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md space-y-5 py-16 text-center">
          <span className="clip-slash mx-auto flex size-14 items-center justify-center bg-primary text-primary-foreground">
            <CalendarClock className="size-7" aria-hidden />
          </span>
          <h1 className="display text-4xl">
            {t("title1")} <span className="text-holo">{t("title2")}</span>
          </h1>
          <p className="text-sm text-muted-foreground">{t("signInPrompt")}</p>
          <Button
            size="xl"
            nativeButton={false}
            render={<Link href="/login?callbackUrl=/daily" />}
          >
            <LogIn data-icon="inline-start" />
            {t("signInCta")}
          </Button>
          <CountdownCard label={t("nextIn")} />
        </div>
      </PageContainer>
    );
  }

  const [attempt, board] = await Promise.all([
    findTodayDailySession(session.user.id),
    getLeaderboard({
      period: "daily",
      mode: "DAILY",
      limit: 10,
      userId: session.user.id,
    }),
  ]);

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="space-y-1.5 text-center">
          <h1 className="display text-4xl sm:text-5xl">
            {t("title1")} <span className="text-holo">{t("title2")}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { rounds: GAME_CONFIG.roundsPerSession })}
          </p>
        </div>

        {attempt === null ? (
          /* Pas encore joué aujourd'hui */
          <div className="panel clip-notch space-y-5 p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("rules")}</p>
            <DailyStartButton />
            <CountdownCard label={t("nextIn")} />
          </div>
        ) : (
          /* Tentative du jour consommée : résultat */
          <div className="panel clip-notch hard-shadow-signal space-y-4 p-6 text-center">
            <p className="overline-label text-muted-foreground">
              {attempt.status === "COMPLETED"
                ? t("yourResult")
                : t("attemptUsed")}
            </p>
            <p className="display text-6xl text-signal tabular-nums">
              {attempt.score}
              <span className="ml-2 text-xl text-muted-foreground">
                / {maxScore}
              </span>
            </p>
            {board.me && attempt.status === "COMPLETED" && (
              <p className="font-heading text-sm font-bold uppercase">
                <Trophy
                  className="mr-1.5 inline size-4 text-signal"
                  aria-hidden
                />
                {t("todayRank", { rank: board.me.rank })}
              </p>
            )}
            {attempt.status === "COMPLETED" && (
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link href={`/stats/${attempt.id}`} />}
              >
                <ListOrdered data-icon="inline-start" />
                {t("review")}
              </Button>
            )}
            <CountdownCard label={t("nextIn")} />
          </div>
        )}

        <section className="space-y-3">
          <h2 className="display flex items-center gap-2 text-2xl">
            <span className="clip-slash flex h-7 w-8 items-center justify-center bg-primary/15 text-primary">
              <Trophy className="size-4" aria-hidden />
            </span>
            {t("todayBoard")}
          </h2>
          <LeaderboardTable data={board} currentUserId={session.user.id} />
        </section>
      </div>
    </PageContainer>
  );
}
