"use client";

import { Crosshair, Gamepad2, Timer, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TILES = [
  { key: "games", icon: Gamepad2, tint: "text-primary" },
  { key: "best", icon: Trophy, tint: "text-signal" },
  { key: "accuracy", icon: Crosshair, tint: "text-info" },
  { key: "time", icon: Timer, tint: "text-muted-foreground" },
] as const;

/**
 * Tableau de bord des statistiques. Contenu temporaire : sera alimenté
 * par les parties enregistrées quand la feature stats sera développée.
 */
export function StatsOverview() {
  const t = useTranslations("stats");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile, i) => (
          <FadeIn key={tile.key} delay={i * 0.06}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="overline-label text-muted-foreground">
                  {t(`tiles.${tile.key}.label`)}
                </CardTitle>
                <tile.icon className={`size-4 ${tile.tint}`} aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="display text-4xl">—</p>
                <p className="text-xs text-muted-foreground">
                  {t(`tiles.${tile.key}.hint`)}
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base tracking-wide uppercase">
              {t("chartTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <p className="text-sm text-muted-foreground">{t("chartEmpty")}</p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
