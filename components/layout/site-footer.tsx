"use client";

import { usePathname } from "next/navigation";

import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  const pathname = usePathname();

  // L'atelier admin et le jeu occupent tout l'écran : pas de footer
  if (pathname.startsWith("/admin") || pathname.startsWith("/play")) {
    return null;
  }

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>
          {siteConfig.name} — projet communautaire, non affilié à Bad Guitar
          Studio.
        </p>
        <p className="text-xs">Fait avec précision. 🎯</p>
      </div>
    </footer>
  );
}
