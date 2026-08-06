"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const NAV_ITEMS = [
  { href: "/", key: "home" },
  { href: "/play", key: "play" },
  { href: "/stats", key: "stats" },
  { href: "/admin", key: "admin" },
] as const;

function isActiveLink(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();
  const { data: session } = useSession();

  // Le lien Admin n'apparaît que pour les administrateurs connectés
  const visibleItems = NAV_ITEMS.filter(
    (item) => item.href !== "/admin" || session?.user?.role === "ADMIN",
  );

  return (
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Lockup logo : marque tranchée + wordmark display */}
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          onClick={closeMobileNav}
        >
          <span className="clip-slash flex h-8 w-9 items-center justify-center bg-primary text-primary-foreground transition-transform group-hover:-skew-x-3">
            <Crosshair className="size-4.5" aria-hidden />
          </span>
          <span className="display text-xl leading-none">
            Frag<span className="text-primary">Punk</span>{" "}
            <span className="text-signal">Guessr</span>
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label={t("main")}
        >
          {visibleItems.map((item) => {
            const active = isActiveLink(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative px-3 py-2 font-heading text-sm font-semibold tracking-wide uppercase transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(item.key)}
                {active && (
                  <motion.span
                    layoutId="nav-slash"
                    className="absolute inset-x-3 -bottom-px h-[3px] -skew-x-[30deg] bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {/* render → <a> : nativeButton={false} requis par Base UI */}
          <Button
            size="sm"
            className="glow-primary"
            nativeButton={false}
            render={<Link href="/play" />}
          >
            {t("launch")}
          </Button>
          {session?.user && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    aria-label={t("logout")}
                  >
                    <LogOut />
                  </Button>
                }
              />
              <TooltipContent>
                {t("logoutTooltip", { email: session.user.email ?? "" })}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Bouton menu mobile */}
        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileNav}
            aria-expanded={isMobileNavOpen}
            aria-label={isMobileNavOpen ? t("closeMenu") : t("openMenu")}
          >
            {isMobileNavOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
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
            aria-label={t("mobile")}
          >
            <ul className="flex flex-col gap-1 p-4">
              {visibleItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobileNav}
                    className={cn(
                      "block px-3 py-2.5 font-heading text-sm font-semibold tracking-wide uppercase transition-colors",
                      isActiveLink(pathname, item.href)
                        ? "clip-slash bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
              {session?.user && (
                <li>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-2 px-3 py-2.5 font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <LogOut className="size-4" aria-hidden />
                    {t("logout")}
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
