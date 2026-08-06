"use client";

import { FolderOpen, Map as MapIcon, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/admin", key: "workshop", icon: MapIcon },
  { href: "/admin/assets", key: "assets", icon: FolderOpen },
  { href: "/admin/users", key: "users", icon: Users },
] as const;

/** Sous-navigation de l'administration. */
export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("adminNav");

  return (
    <nav
      className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-3"
      aria-label={t("aria")}
    >
      {SECTIONS.map((section) => {
        const active =
          section.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 font-heading text-sm font-semibold tracking-wide uppercase transition-colors",
              active
                ? "clip-slash bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <section.icon className="size-4" aria-hidden />
            {t(section.key)}
          </Link>
        );
      })}
    </nav>
  );
}
