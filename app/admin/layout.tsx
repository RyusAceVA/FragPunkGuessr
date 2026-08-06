import { redirect } from "next/navigation";

import { AdminNav } from "@/features/admin/components/admin-nav";
import { auth } from "@/features/auth";

/**
 * Layout commun de l'administration : garde serveur (défense en
 * profondeur — le middleware reste la barrière officielle) +
 * sous-navigation Atelier / Assets / Utilisateurs.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <AdminNav />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
