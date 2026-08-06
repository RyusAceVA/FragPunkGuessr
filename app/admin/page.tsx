import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminWorkbench } from "@/features/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminNav");
  return { title: t("metaWorkshop") };
}

/** Atelier de placement des screenshots (protégé par le layout admin). */
export default function AdminPage() {
  return (
    <div className="h-full">
      <AdminWorkbench />
    </div>
  );
}
