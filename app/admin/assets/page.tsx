import type { Metadata } from "next";

import { AssetsManager } from "@/features/assets";

export const metadata: Metadata = {
  title: "Admin — Assets",
};

export default function AdminAssetsPage() {
  return (
    <div className="h-full">
      <AssetsManager />
    </div>
  );
}
