"use client";

import { Menu } from "@base-ui/react/menu";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronDown,
  LogOut,
  ShieldHalf,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useTransition } from "react";

import { logout } from "@/features/auth/actions";
import type { ProfileData } from "@/features/profile/types";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export interface HeaderUser {
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Avatar + nom d'affichage : décoratifs, chargés côté client
 * (react-query ["profile"], invalidé après édition du profil) — le nom
 * de session sert de repli immédiat, aucune requête bloquante au rendu.
 */
function useHeaderProfile(enabled: boolean) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchJson<ProfileData>("/api/profile"),
    enabled,
    staleTime: 5 * 60_000,
    retry: 0,
  });
}

function AvatarBubble({
  avatarUrl,
  fallback,
  className,
}: {
  avatarUrl: string | null | undefined;
  fallback: string;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- API d'assets externe
      <img
        src={avatarUrl}
        alt=""
        className={cn(
          "size-7 shrink-0 rounded-sm border border-border object-cover",
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "clip-slash flex size-7 shrink-0 items-center justify-center bg-primary/20 font-heading text-xs font-bold text-primary uppercase",
        className,
      )}
      aria-hidden
    >
      {fallback.slice(0, 2) || <UserRound className="size-3.5" />}
    </span>
  );
}

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 font-heading text-sm font-semibold tracking-wide uppercase text-muted-foreground outline-none transition-colors data-[highlighted]:bg-primary/15 data-[highlighted]:text-foreground";

/** Menu utilisateur : Profil · Statistiques · Administration · Déconnexion. */
export function UserMenu({ user }: { user: HeaderUser }) {
  const t = useTranslations("nav");
  const [isPending, startTransition] = useTransition();
  const profileQuery = useHeaderProfile(true);
  const profile = profileQuery.data;
  const displayName = profile?.displayName ?? user.name;

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "clip-slash flex cursor-pointer items-center gap-2 bg-muted py-1 pr-2 pl-1.5 transition-colors hover:bg-accent data-[popup-open]:bg-accent",
          isPending && "opacity-60",
        )}
        aria-label={t("userMenu")}
      >
        <AvatarBubble avatarUrl={profile?.avatarUrl} fallback={user.name} />
        <span className="max-w-28 truncate font-heading text-xs font-bold tracking-wide uppercase">
          {displayName}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="panel clip-notch-sm hard-shadow min-w-52 py-1.5">
            <div className="border-b border-border px-3 pt-1 pb-2.5">
              <p className="truncate font-heading text-sm font-bold uppercase">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>

            <Menu.Item className={ITEM_CLASS} render={<Link href="/profile" />}>
              <UserRound className="size-4" aria-hidden />
              {t("profile")}
            </Menu.Item>
            <Menu.Item className={ITEM_CLASS} render={<Link href="/stats" />}>
              <BarChart3 className="size-4" aria-hidden />
              {t("stats")}
            </Menu.Item>
            {user.role === "ADMIN" && (
              <Menu.Item className={ITEM_CLASS} render={<Link href="/admin" />}>
                <ShieldHalf className="size-4" aria-hidden />
                {t("admin")}
              </Menu.Item>
            )}

            <div className="my-1 border-t border-border" aria-hidden />

            <Menu.Item
              className={cn(ITEM_CLASS, "text-destructive")}
              onClick={() => startTransition(() => logout())}
            >
              <LogOut className="size-4" aria-hidden />
              {t("logout")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
