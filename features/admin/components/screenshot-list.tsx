"use client";

import { MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { difficultyStyle } from "../constants";
import type { ScreenshotFilter } from "../store";
import {
  assetUrl,
  isPlaced,
  type AdminFloor,
  type AdminScreenshot,
} from "../types";

interface ScreenshotListProps {
  screenshots: AdminScreenshot[];
  floors: AdminFloor[];
  selectedId: string | null;
  filter: ScreenshotFilter;
  search: string;
  onFilterChange: (filter: ScreenshotFilter) => void;
  onSearchChange: (search: string) => void;
  onSelect: (screenshot: AdminScreenshot) => void;
}

/**
 * Liste des screenshots de la map avec recherche et filtre placé/à placer.
 * `content-visibility: auto` sur les items : le navigateur ne rend que
 * ceux visibles — la liste reste fluide avec des milliers d'entrées.
 */
export function ScreenshotList({
  screenshots,
  floors,
  selectedId,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onSelect,
}: ScreenshotListProps) {
  const t = useTranslations("workshop");
  const floorNames = useMemo(
    () => new Map(floors.map((f) => [f.id, f.name])),
    [floors],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return screenshots.filter((s) => {
      if (filter === "placed" && !isPlaced(s)) return false;
      if (filter === "unplaced" && isPlaced(s)) return false;
      if (!query) return true;
      return (
        s.code.toLowerCase().includes(query) ||
        (s.zoneName?.toLowerCase().includes(query) ?? false) ||
        s.tags.some((tag) => tag.includes(query))
      );
    });
  }, [screenshots, filter, search]);

  const unplacedCount = screenshots.filter((s) => !isPlaced(s)).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="relative">
        <Search
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-8"
          aria-label={t("searchAria")}
        />
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => onFilterChange(value as ScreenshotFilter)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            {t("tabAll", { count: screenshots.length })}
          </TabsTrigger>
          <TabsTrigger value="unplaced" className="flex-1">
            {t("tabUnplaced", { count: unplacedCount })}
          </TabsTrigger>
          <TabsTrigger value="placed" className="flex-1">
            {t("tabPlaced", { count: screenshots.length - unplacedCount })}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="-mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1">
        {filtered.map((screenshot) => {
          const selected = screenshot.id === selectedId;
          const placed = isPlaced(screenshot);
          return (
            <li
              key={screenshot.id}
              className="[contain-intrinsic-size:auto_52px] [content-visibility:auto]"
            >
              <button
                type="button"
                onClick={() => onSelect(screenshot)}
                className={cn(
                  "clip-notch-sm flex w-full items-center gap-2.5 border p-1.5 text-left transition-colors",
                  selected
                    ? "border-primary/60 bg-primary/10"
                    : "border-transparent hover:bg-accent",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- miniature d'asset locale */}
                <img
                  src={assetUrl(screenshot.assetPath)}
                  alt=""
                  className="h-10 w-16 shrink-0 rounded-sm bg-black/40 object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 shrink-0",
                        difficultyStyle(screenshot.difficulty).dot,
                      )}
                      aria-hidden
                    />
                    <span className="truncate font-mono text-xs font-semibold">
                      #{screenshot.code}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {screenshot.zoneName ?? t("zoneUnset")}
                  </span>
                </span>
                {placed && (
                  <span
                    className="flex shrink-0 items-center gap-1 text-[10px] text-info"
                    title={t("placedOn", {
                      floor: floorNames.get(screenshot.floorId) ?? "?",
                    })}
                  >
                    <MapPin className="size-3" aria-hidden />
                    {floorNames.get(screenshot.floorId) ?? "?"}
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-2 py-6 text-center text-xs text-muted-foreground">
            {t("noMatch")}
          </li>
        )}
      </ul>
    </div>
  );
}
