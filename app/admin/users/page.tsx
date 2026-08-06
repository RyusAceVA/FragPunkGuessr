import type { Metadata } from "next";

import { UsersManager } from "@/features/admin/components/users/users-manager";

export const metadata: Metadata = {
  title: "Admin — Utilisateurs",
};

export default function AdminUsersPage() {
  return (
    <div className="h-full overflow-y-auto">
      <UsersManager />
    </div>
  );
}
