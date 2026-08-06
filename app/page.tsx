import { BarChart3, Map as MapIcon, Medal, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Artwork } from "@/components/artwork";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { key: "maps", icon: MapIcon },
  { key: "stats", icon: BarChart3 },
  { key: "achievements", icon: Medal },
  { key: "leaderboard", icon: Trophy },
] as const;

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <>
      {/* ── Héros ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="bg-grid mask-fade-edges absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:py-24">
          <div className="space-y-6 text-center lg:text-left">
            <FadeIn>
              <span className="clip-slash inline-block bg-signal px-3 py-1 font-heading text-xs font-bold tracking-widest text-background uppercase italic">
                {t("badge")}
              </span>
            </FadeIn>
            <FadeIn delay={0.08}>
              <h1 className="display text-5xl text-balance sm:text-7xl">
                {t("titleA")}
                <br />
                <span className="text-primary">{t("titleB")}</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.16}>
              <p className="mx-auto max-w-xl text-base text-balance text-muted-foreground sm:text-lg lg:mx-0">
                {t("subtitle")}
              </p>
            </FadeIn>
            <FadeIn delay={0.24}>
              <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  size="lg"
                  className="glow-primary px-8"
                  nativeButton={false}
                  render={<Link href="/play" />}
                >
                  {t("ctaPlay")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/stats" />}
                >
                  {t("ctaStats")}
                </Button>
              </div>
            </FadeIn>
          </div>

          {/* Slot d'illustration configurable (branding.json) */}
          <FadeIn delay={0.2} className="hidden lg:block">
            <div className="relative">
              <div
                className="stripes-primary absolute -inset-x-4 top-8 bottom-0 -skew-x-6 opacity-15"
                aria-hidden
              />
              <Artwork slot="home.hero" className="relative h-80" />
            </div>
          </FadeIn>
        </div>
        <div className="slash-divider" aria-hidden />
      </section>

      {/* ── Points forts ──────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <FadeIn key={feature.key} delay={i * 0.08}>
              <article className="panel clip-notch group relative h-full space-y-3 p-5 transition-colors hover:border-primary/50">
                <span
                  className="display absolute top-3 right-4 text-3xl text-muted-foreground/25 transition-colors group-hover:text-primary/40"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="clip-slash flex h-9 w-10 items-center justify-center bg-primary/15 text-primary">
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h2 className="font-heading text-lg font-bold tracking-wide uppercase">
                  {t(`features.${feature.key}.title`)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(`features.${feature.key}.description`)}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>
    </>
  );
}
