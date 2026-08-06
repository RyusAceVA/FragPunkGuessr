import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AssetsManager } from "@/features/assets";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminNav");
  return { title: t("metaAssets") };
}

export default function AdminAssetsPage() {
  return (
    <div className="h-full">
      <AssetsManager />
    </div>
  );
}
