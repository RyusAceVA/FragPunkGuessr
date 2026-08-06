import type { Metadata } from "next";

import { AdminWorkbench } from "@/features/admin";

export const metadata: Metadata = {
  title: "Admin — Atelier",
};

/** Atelier de placement des screenshots (protégé par le layout admin). */
export default function AdminPage() {
  return (
    <div className="h-full">
      <AdminWorkbench />
    </div>
  );
}
