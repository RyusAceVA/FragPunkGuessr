import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/layout/page-container";
import { StatsOverview } from "@/features/stats";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stats");
  return { title: t("meta") };
}

export default async function StatsPage() {
  const t = await getTranslations("stats");

  return (
    <PageContainer>
      <div className="space-y-1.5">
        <h1 className="display text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
      </div>
      <StatsOverview />
    </PageContainer>
  );
}
