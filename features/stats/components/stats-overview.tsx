import { Crosshair, Gamepad2, Timer, Trophy } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatTile {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}

const STAT_TILES: readonly StatTile[] = [
  { label: "Parties jouées", icon: Gamepad2, hint: "Toutes maps confondues" },
  { label: "Meilleur score", icon: Trophy, hint: "Record personnel" },
  {
    label: "Précision moyenne",
    icon: Crosshair,
    hint: "Distance moyenne au point exact",
  },
  {
    label: "Temps de jeu",
    icon: Timer,
    hint: "Cumulé sur toutes les sessions",
  },
] as const;

/**
 * Tableau de bord des statistiques. Contenu temporaire : sera alimenté
 * par UserStats (Prisma) via React Query quand les parties existeront.
 */
export function StatsOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_TILES.map((tile, i) => (
          <FadeIn key={tile.label} delay={i * 0.06}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tile.label}
                </CardTitle>
                <tile.icon className="size-4 text-neon-cyan" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">{tile.hint}</p>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Progression des scores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <p className="text-sm text-muted-foreground">
              Les graphiques apparaîtront ici dès que tes premières parties
              seront enregistrées.
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
