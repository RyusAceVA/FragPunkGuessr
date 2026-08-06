"use client";

import { ChevronLeft, ChevronRight, Dices } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScreenshotNavigatorProps {
  /** Position 1-indexée du screenshot courant (0 = aucune sélection) */
  position: number;
  total: number;
  unplacedCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onRandomUnplaced: () => void;
}

/** Navigation rapide : précédent / suivant / aléatoire non placé. */
export function ScreenshotNavigator({
  position,
  total,
  unplacedCount,
  onPrevious,
  onNext,
  onRandomUnplaced,
}: ScreenshotNavigatorProps) {
  const t = useTranslations("workshop");

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPrevious}
              disabled={total === 0}
              aria-label={t("prev")}
            >
              <ChevronLeft />
            </Button>
          }
        />
        <TooltipContent>
          {t("prev")} <kbd className="ml-1">←</kbd>
        </TooltipContent>
      </Tooltip>

      <span className="min-w-12 text-center font-mono text-xs text-muted-foreground tabular-nums">
        {position > 0 ? `${position}/${total}` : `–/${total}`}
      </span>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNext}
              disabled={total === 0}
              aria-label={t("next")}
            >
              <ChevronRight />
            </Button>
          }
        />
        <TooltipContent>
          {t("next")} <kbd className="ml-1">→</kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRandomUnplaced}
              disabled={unplacedCount === 0}
              aria-label={t("random", { count: unplacedCount })}
            >
              <Dices />
            </Button>
          }
        />
        <TooltipContent>
          {t("random", { count: unplacedCount })} <kbd className="ml-1">R</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
