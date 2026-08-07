"use client";

import { Crown } from "lucide-react";
import { useTranslations } from "next-intl";

import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

import type { LeaderboardData } from "../types";

const PODIUM_STYLES: Record<number, string> = {
  1: "bg-signal text-background",
  2: "bg-info text-background",
  3: "bg-primary text-primary-foreground",
};

function Avatar({
  avatarUrl,
  username,
}: {
  avatarUrl: string | null;
  username: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- API d'assets externe
      <img
        src={avatarUrl}
        alt=""
        loading="lazy"
        className="size-9 shrink-0 rounded-sm border border-border object-cover"
      />
    );
  }
  return (
    <span
      className="clip-slash flex size-9 shrink-0 items-center justify-center bg-primary/15 font-heading text-sm font-bold text-primary uppercase"
      aria-hidden
    >
      {username.slice(0, 2)}
    </span>
  );
}

interface LeaderboardTableProps {
  data: LeaderboardData;
  currentUserId: string | null;
}

/** Classement : rang, joueur, parties, meilleur score. */
export function LeaderboardTable({
  data,
  currentUserId,
}: LeaderboardTableProps) {
  const t = useTranslations("leaderboard");

  if (data.entries.length === 0) {
    return (
      <div className="panel clip-notch p-8 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  const meOutsideTop =
    data.me !== null &&
    currentUserId !== null &&
    !data.entries.some((e) => e.userId === currentUserId);

  return (
    <div className="space-y-2">
      {data.entries.map((entry, i) => {
        const isMe = entry.userId === currentUserId;
        return (
          <FadeIn key={entry.userId} delay={Math.min(i * 0.03, 0.3)}>
            <div
              className={cn(
                "panel clip-notch-sm flex items-center gap-3 p-2.5",
                isMe && "border-primary/60 bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "clip-slash flex h-8 w-10 shrink-0 items-center justify-center font-heading text-sm font-bold tabular-nums",
                  PODIUM_STYLES[entry.rank] ?? "bg-muted text-muted-foreground",
                )}
              >
                {entry.rank === 1 ? (
                  <Crown className="size-4" aria-hidden />
                ) : (
                  `#${entry.rank}`
                )}
              </span>

              <Avatar avatarUrl={entry.avatarUrl} username={entry.username} />

              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-bold uppercase">
                  {entry.displayName ?? entry.username}
                  {isMe && (
                    <span className="ml-1.5 text-xs text-primary">
                      {t("you")}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{entry.username} · {t("games", { count: entry.gamesPlayed })}
                </p>
              </div>

              <p className="display text-2xl text-signal tabular-nums">
                {entry.bestScore}
              </p>
            </div>
          </FadeIn>
        );
      })}

      {meOutsideTop && data.me && (
        <div className="panel clip-notch-sm flex items-center gap-3 border-primary/60 bg-primary/10 p-2.5">
          <span className="clip-slash flex h-8 w-10 shrink-0 items-center justify-center bg-muted font-heading text-sm font-bold text-muted-foreground tabular-nums">
            #{data.me.rank}
          </span>
          <p className="flex-1 font-heading text-sm font-bold uppercase">
            {t("yourRank")}
          </p>
          <p className="display text-2xl text-signal tabular-nums">
            {data.me.bestScore}
          </p>
        </div>
      )}
    </div>
  );
}
