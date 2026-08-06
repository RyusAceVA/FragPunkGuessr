"use client";

import { FolderOpen, Map as MapIcon, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/admin", label: "Atelier", icon: MapIcon },
  { href: "/admin/assets", label: "Assets", icon: FolderOpen },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
] as const;

/** Sous-navigation de l'administration. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-3"
      aria-label="Sections d'administration"
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
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <section.icon className="size-4" aria-hidden />
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
