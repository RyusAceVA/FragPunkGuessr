"use client";

import { useQuery } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Catalogue des lancers publié par l'API d'assets communautaire. */
const LANCERS_JSON_URL =
  "https://raw.githubusercontent.com/RyusAceVA/fragpunk-assets/main/data/lancers.json";

interface LancersCatalog {
  lancers: { code: string; name: string; portrait: string }[];
}

function useLancerPortraits() {
  return useQuery({
    queryKey: ["lancers-portraits"],
    queryFn: async (): Promise<LancersCatalog> => {
      const res = await fetch(LANCERS_JSON_URL);
      if (!res.ok) throw new Error("catalog unavailable");
      return (await res.json()) as LancersCatalog;
    },
    staleTime: Infinity,
    retry: 1,
  });
}

interface AvatarPickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

/**
 * Grille d'avatars : les portraits de lancers de l'API fragpunk-assets.
 * Aucune autre source possible — l'URL est aussi validée côté serveur.
 */
export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const t = useTranslations("profile");
  const catalogQuery = useLancerPortraits();
  const lancers = catalogQuery.data?.lancers ?? [];

  if (catalogQuery.isLoading) {
    return (
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
        {Array.from({ length: 16 }, (_, i) => (
          <Skeleton key={i} className="aspect-square rounded-sm" />
        ))}
      </div>
    );
  }
  if (lancers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("avatarUnavailable")}</p>
    );
  }

  return (
    <div
      className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8"
      role="radiogroup"
      aria-label={t("avatar")}
    >
      {/* Sans avatar */}
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        aria-label={t("noAvatar")}
        onClick={() => onChange(null)}
        className={cn(
          "flex aspect-square items-center justify-center rounded-sm border bg-muted text-muted-foreground transition-colors",
          value === null
            ? "border-primary ring-2 ring-primary/50"
            : "border-border hover:border-foreground/40",
        )}
      >
        <Ban className="size-4" aria-hidden />
      </button>

      {lancers.map((lancer) => {
        const selected = value === lancer.portrait;
        return (
          <button
            key={lancer.code}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={lancer.name}
            onClick={() => onChange(lancer.portrait)}
            className={cn(
              "aspect-square overflow-hidden rounded-sm border transition-all",
              selected
                ? "border-primary ring-2 ring-primary/50"
                : "border-border opacity-80 hover:opacity-100",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- API d'assets externe */}
            <img
              src={lancer.portrait}
              alt={lancer.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}
