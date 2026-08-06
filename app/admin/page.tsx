import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminWorkbench } from "@/features/admin";
import { auth } from "@/features/auth";

export const metadata: Metadata = {
  title: "Admin",
};

/**
 * Atelier d'administration du contenu (placement des screenshots).
 * Protégé par le middleware ; la vérification ci-dessous est une
 * défense en profondeur (le middleware reste la barrière officielle).
 */
export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="h-[calc(100dvh-4rem)]">
      <AdminWorkbench />
    </div>
  );
}
