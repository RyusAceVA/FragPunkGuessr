import { BarChart3, Map as MapIcon, Medal, Trophy } from "lucide-react";
import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";

interface FeatureHighlight {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const HIGHLIGHTS: readonly FeatureHighlight[] = [
  {
    title: "Toutes les maps",
    description:
      "Chaque map de FragPunk, étage par étage, avec des screenshots soigneusement sélectionnés.",
    icon: MapIcon,
  },
  {
    title: "Stats détaillées",
    description:
      "Précision, temps de réaction, progression par map : mesure chaque aspect de ton game sense.",
    icon: BarChart3,
  },
  {
    title: "Succès à débloquer",
    description:
      "Des défis qui récompensent la régularité comme les guesses parfaits.",
    icon: Medal,
  },
  {
    title: "Classements",
    description: "Compare-toi aux meilleurs, globalement ou map par map.",
    icon: Trophy,
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid mask-fade-edges absolute inset-0" aria-hidden />
        <div
          className="absolute top-[-10rem] left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[128px]"
          aria-hidden
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
          <FadeIn>
            <Badge
              variant="outline"
              className="mb-6 border-primary/40 text-primary"
            >
              Alpha en construction
            </Badge>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Tu crois connaître les maps de FragPunk{" "}
              <span className="text-gradient-neon">par cœur ?</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="mt-6 max-w-xl text-base text-balance text-muted-foreground sm:text-lg">
              {siteConfig.tagline} Un screenshot, un plan, un guess — prouve ton
              game sense.
            </p>
          </FadeIn>
          <FadeIn delay={0.24}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {/* render → <a> : nativeButton={false} requis par Base UI */}
              <Button
                size="lg"
                className="glow-primary"
                nativeButton={false}
                render={<Link href="/play" />}
              >
                Jouer maintenant
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/stats" />}
              >
                Voir les stats
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Points forts */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.08}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader>
                  <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <feature.icon className="size-5" aria-hidden />
                  </span>
                  <CardTitle className="font-heading text-lg">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>
    </>
  );
}
