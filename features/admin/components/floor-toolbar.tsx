"use client";

import { Images, Maximize, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DIFFICULTIES } from "@/types";

import { DIFFICULTY_STYLES, UNSET_STYLE } from "../constants";

interface FloorToolbarProps {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  showAllMarkers: boolean;
  onShowAllMarkersChange: (value: boolean) => void;
  thumbnailMode: boolean;
  onThumbnailModeChange: (value: boolean) => void;
  placedCount: number;
  floorName: string;
}

/** Barre d'outils du visualiseur : zoom, modes d'affichage, légende. */
export function FloorToolbar({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onFit,
  showAllMarkers,
  onShowAllMarkersChange,
  thumbnailMode,
  onThumbnailModeChange,
  placedCount,
  floorName,
}: FloorToolbarProps) {
  const t = useTranslations("workshop");
  const tDiff = useTranslations("difficulty");

  const legend = [
    { key: "UNSET", dot: UNSET_STYLE.dot },
    ...DIFFICULTIES.map((d) => ({ key: d, dot: DIFFICULTY_STYLES[d].dot })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-3 py-2">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" onClick={onZoomOut}>
                <Minus />
              </Button>
            }
          />
          <TooltipContent>{t("zoomOut")}</TooltipContent>
        </Tooltip>
        <span className="w-12 text-center font-mono text-xs text-muted-foreground tabular-nums">
          {zoomPercent}%
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" onClick={onZoomIn}>
                <Plus />
              </Button>
            }
          />
          <TooltipContent>{t("zoomIn")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" onClick={onFit}>
                <Maximize />
              </Button>
            }
          />
          <TooltipContent>{t("fit")}</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="hidden h-5 sm:block" />

      <div className="flex items-center gap-2">
        <Checkbox
          id="show-all-markers"
          checked={showAllMarkers}
          onCheckedChange={(checked) =>
            onShowAllMarkersChange(checked === true)
          }
        />
        <Label htmlFor="show-all-markers" className="cursor-pointer text-xs">
          {t("showAll")}
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="thumbnail-mode"
          checked={thumbnailMode}
          onCheckedChange={(checked) => onThumbnailModeChange(checked === true)}
        />
        <Label
          htmlFor="thumbnail-mode"
          className="flex cursor-pointer items-center gap-1 text-xs"
        >
          <Images className="size-3.5" aria-hidden />
          {t("thumbnails")}
        </Label>
      </div>

      <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
        <div className="hidden items-center gap-3 lg:flex">
          {legend.map((entry) => (
            <span key={entry.key} className="flex items-center gap-1.5">
              <span className={cn("size-2", entry.dot)} aria-hidden />
              {tDiff(entry.key)}
            </span>
          ))}
        </div>
        <span className="overline-label">
          {t("placedCount", { floor: floorName, count: placedCount })}
        </span>
      </div>
    </div>
  );
}
