import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatsOverview } from "@/features/stats";

export const metadata: Metadata = {
  title: "Stats",
};

export default function StatsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Statistiques"
        description="Ton game sense en chiffres. Ces données seront alimentées automatiquement par tes parties."
      />
      <StatsOverview />
    </PageContainer>
  );
}
