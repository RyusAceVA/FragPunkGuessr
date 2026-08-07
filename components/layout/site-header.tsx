"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, LogIn, LogOut, Menu, UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { type HeaderUser, UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const NAV_ITEMS = [
  { href: "/", key: "home" },
  { href: "/play", key: "play" },
  { href: "/daily", key: "daily" },
  { href: "/leaderboards", key: "leaderboards" },
  { href: "/stats", key: "stats" },
  { href: "/admin", key: "admin" },
] as const;

function isActiveLink(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Header du site. `user` vient du RootLayout (session lue par auth()
 * côté serveur) : chaque Server Action d'authentification invalide le
 * Router Cache, le layout se re-rend, le header est toujours à jour —
 * sans SessionProvider ni rechargement manuel.
 */
export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();
  const [isLoggingOut, startLogout] = useTransition();

  // Le lien Admin n'apparaît que pour les administrateurs connectés
  const visibleItems = NAV_ITEMS.filter(
    (item) => item.href !== "/admin" || user?.role === "ADMIN",
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
          <Button size="sm" nativeButton={false} render={<Link href="/play" />}>
            {t("launch")}
          </Button>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              <LogIn data-icon="inline-start" />
              {t("signIn")}
            </Button>
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
              {user ? (
                <>
                  <li>
                    <Link
                      href="/profile"
                      onClick={closeMobileNav}
                      className="flex w-full items-center gap-2 px-3 py-2.5 font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <UserRound className="size-4" aria-hidden />
                      {t("profile")}
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      disabled={isLoggingOut}
                      onClick={() => startLogout(() => logout())}
                      className="flex w-full items-center gap-2 px-3 py-2.5 font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
                    >
                      <LogOut className="size-4" aria-hidden />
                      {t("logout")}
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/login"
                    onClick={closeMobileNav}
                    className="flex w-full items-center gap-2 px-3 py-2.5 font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <LogIn className="size-4" aria-hidden />
                    {t("signIn")}
                  </Link>
                </li>
              )}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
