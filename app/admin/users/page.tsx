import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { UsersManager } from "@/features/admin/components/users/users-manager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminNav");
  return { title: t("metaUsers") };
}

export default function AdminUsersPage() {
  return (
    <div className="h-full overflow-y-auto">
      <UsersManager />
    </div>
  );
}
