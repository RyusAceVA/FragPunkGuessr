"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navLinks, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

function isActiveLink(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();
  const { data: session } = useSession();

  // Le lien Admin n'apparaît que pour les administrateurs connectés
  const visibleLinks = navLinks.filter(
    (link) => link.href !== "/admin" || session?.user?.role === "ADMIN",
  );

  return (
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={closeMobileNav}
        >
          <span className="glow-primary flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Crosshair className="size-4.5" aria-hidden />
          </span>
          <span className="text-gradient-neon font-heading text-lg font-bold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navigation principale"
        >
          {visibleLinks.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="glow-primary absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1.5 md:flex">
          {/* render → <a> : nativeButton={false} requis par Base UI */}
          <Button
            size="sm"
            className="glow-primary"
            nativeButton={false}
            render={<Link href="/play" />}
          >
            Lancer une partie
          </Button>
          {session?.user && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    aria-label="Se déconnecter"
                  >
                    <LogOut />
                  </Button>
                }
              />
              <TooltipContent>
                Se déconnecter ({session.user.email})
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Bouton menu mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileNav}
          aria-expanded={isMobileNavOpen}
          aria-label={isMobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isMobileNavOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </Button>
      </div>

      {/* Navigation mobile */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass overflow-hidden border-t md:hidden"
            aria-label="Navigation mobile"
          >
            <ul className="flex flex-col gap-1 p-4">
              {visibleLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMobileNav}
                    className={cn(
                      "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActiveLink(pathname, link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {session?.user && (
                <li>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Se déconnecter
                  </button>
                </li>
              )}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
