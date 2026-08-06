"use client";

import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";

interface BrandingSlot {
  src: string | null;
  alt: string;
}

interface BrandingConfig {
  slots: Record<string, BrandingSlot | undefined>;
}

/**
 * Système d'illustrations configurable SANS code :
 * public/branding/branding.json associe des images (API fragpunk-assets,
 * fichiers locaux…) à des « slots » nommés. Slot absent ou src null →
 * fallback graphique neutre (halftone), jamais d'image cassée.
 */
function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: async (): Promise<BrandingConfig> => {
      const res = await fetch("/branding/branding.json");
      if (!res.ok) return { slots: {} };
      return (await res.json()) as BrandingConfig;
    },
    staleTime: Infinity,
    retry: 0,
  });
}

interface ArtworkProps {
  slot: string;
  className?: string;
  /** Classes appliquées à l'image elle-même */
  imgClassName?: string;
}

/** Illustration d'un slot de branding, avec fallback halftone. */
export function Artwork({ slot, className, imgClassName }: ArtworkProps) {
  const { data } = useBranding();
  const entry = data?.slots?.[slot];

  return (
    <div
      className={cn(
        "texture-halftone pointer-events-none relative overflow-hidden",
        className,
      )}
      aria-hidden={!entry?.alt}
    >
      {entry?.src && (
        // eslint-disable-next-line @next/next/no-img-element -- source configurable (API d'assets externe)
        <img
          src={entry.src}
          alt={entry.alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-contain object-bottom drop-shadow-[6px_6px_0_var(--shadow-ink)]",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
