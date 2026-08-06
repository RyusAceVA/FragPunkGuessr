"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const t = useTranslations("footer");

  // L'atelier admin et le jeu occupent tout l'écran : pas de footer
  if (pathname.startsWith("/admin") || pathname.startsWith("/play")) {
    return null;
  }

  return (
    <footer className="relative">
      <div className="slash-divider" aria-hidden />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>{t("disclaimer")}</p>
        <p className="overline-label">{t("madeWith")}</p>
      </div>
    </footer>
  );
}
