"use client";

import { Images, Maximize, Minus, Plus } from "lucide-react";

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

const LEGEND = [UNSET_STYLE, ...DIFFICULTIES.map((d) => DIFFICULTY_STYLES[d])];

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
          <TooltipContent>Zoom arrière</TooltipContent>
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
          <TooltipContent>Zoom avant</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" onClick={onFit}>
                <Maximize />
              </Button>
            }
          />
          <TooltipContent>Ajuster à l&apos;écran</TooltipContent>
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
          Afficher tous les screenshots placés
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
          Miniatures
        </Label>
      </div>

      <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
        <div className="hidden items-center gap-3 lg:flex">
          {LEGEND.map((style) => (
            <span key={style.label} className="flex items-center gap-1.5">
              <span
                className={cn("size-2 rounded-full", style.dot)}
                aria-hidden
              />
              {style.label}
            </span>
          ))}
        </div>
        <span className="font-medium">
          {floorName} · {placedCount} placé{placedCount > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
