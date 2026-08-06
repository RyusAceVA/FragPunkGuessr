"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { difficultyStyle } from "../constants";
import { assetUrl, type AdminScreenshot } from "../types";

interface MarkerTooltipProps {
  screenshot: AdminScreenshot;
  /** Position du marqueur dans le référentiel du conteneur (px écran) */
  x: number;
  y: number;
  containerWidth: number;
}

/**
 * Carte de survol d'un marqueur : miniature, numéro, zone, difficulté.
 * Rendue dans l'overlay écran (hors couche zoomée) pour rester nette
 * quel que soit le niveau de zoom.
 */
export function MarkerTooltip({
  screenshot,
  x,
  y,
  containerWidth,
}: MarkerTooltipProps) {
  const styles = difficultyStyle(screenshot.difficulty);
  const clampedX = Math.min(
    Math.max(x, 110),
    Math.max(containerWidth - 110, 110),
  );

  return (
    <div
      className="pointer-events-none absolute z-30 w-52 -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
      style={{ left: clampedX, top: y, translate: "0 calc(-100% - 14px)" }}
      role="tooltip"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- asset locale servie par l'API, pas d'optimisation Next voulue */}
      <img
        src={assetUrl(screenshot.assetPath)}
        alt={`Screenshot ${screenshot.code}`}
        className="h-28 w-full bg-black/50 object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="space-y-1 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold">
            #{screenshot.code}
          </span>
          <Badge variant="secondary" className="gap-1.5 text-[10px]">
            <span
              className={cn("size-1.5 rounded-full", styles.dot)}
              aria-hidden
            />
            {styles.label}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {screenshot.zoneName ?? "Zone non renseignée"}
        </p>
      </div>
    </div>
  );
}
