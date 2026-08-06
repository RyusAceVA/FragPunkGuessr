"use client";

import {
  Crosshair,
  FolderOpen,
  Layers,
  Lock,
  Map as MapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useAssetsMaps, useAssetsStatus } from "../api";
import { useUploadQueue } from "../hooks/use-upload-queue";
import type { AssetsMap } from "../types";
import { CreateMapDialog } from "./create-map-dialog";
import { Dropzone } from "./dropzone";
import { UploadProgress } from "./upload-progress";

/** Panneau plans d'étages : liste + import drag & drop. */
function FloorsPanel({ map, disabled }: { map: AssetsMap; disabled: boolean }) {
  const t = useTranslations("assetsManager");
  const queue = useUploadQueue(map.id, "floor");
  const floors = [...map.floors].sort((a, b) => b.level - a.level);

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-heading text-base font-bold tracking-wide uppercase">
        <Layers className="size-4 text-primary" aria-hidden />
        {t("floorsTitle")}
        <span className="text-xs font-normal text-muted-foreground normal-case">
          {t("floorsImported", { count: floors.length })}
        </span>
      </h2>

      {floors.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {floors.map((floor) => (
            <li key={floor.id}>
              <Badge variant="secondary" className="font-mono normal-case">
                {floor.name}
                <span className="ml-1 text-muted-foreground">
                  {floor.width}×{floor.height}
                </span>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <Dropzone
        onFiles={(files) => void queue.start(files)}
        disabled={disabled || queue.isUploading}
        label={t("floorsDrop")}
        hint={t("floorsHint")}
      />
      <UploadProgress {...queue} />
    </section>
  );
}

/** Panneau screenshots : import massif + progression + placement. */
function ScreenshotsPanel({
  map,
  disabled,
}: {
  map: AssetsMap;
  disabled: boolean;
}) {
  const t = useTranslations("assetsManager");
  const router = useRouter();
  const queue = useUploadQueue(map.id, "screenshot");
  const unplaced = map.screenshotCount - map.placedCount;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold tracking-wide uppercase">
          <Crosshair className="size-4 text-info" aria-hidden />
          {t("screenshotsTitle")}
          <span className="text-xs font-normal text-muted-foreground normal-case">
            {t("screenshotsCounts", {
              imported: map.screenshotCount,
              placed: map.placedCount,
            })}
          </span>
        </h2>
        {unplaced > 0 && (
          <Button
            size="sm"
            onClick={() => router.push(`/admin?map=${map.id}&placement=1`)}
          >
            <Crosshair data-icon="inline-start" />
            {t("startPlacement", { count: unplaced })}
          </Button>
        )}
      </div>

      <Dropzone
        onFiles={(files) => void queue.start(files)}
        disabled={disabled || queue.isUploading || map.floors.length === 0}
        label={
          map.floors.length === 0
            ? t("screenshotsDropNoFloor")
            : t("screenshotsDrop")
        }
        hint={t("screenshotsHint")}
      />
      <UploadProgress {...queue} />
    </section>
  );
}

/**
 * Administration → Assets : créer une map, importer plans et screenshots
 * par glisser-déposer — sans jamais toucher aux dossiers à la main.
 * La synchronisation de dossiers reste disponible dans l'atelier :
 * les deux alimentent exactement la même structure.
 */
export function AssetsManager() {
  const t = useTranslations("assetsManager");
  const mapsQuery = useAssetsMaps();
  const statusQuery = useAssetsStatus();
  const maps = mapsQuery.data ?? [];
  const writable = statusQuery.data?.writable ?? true;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = maps.find((m) => m.id === selectedId) ?? maps[0] ?? null;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Colonne maps */}
      <aside className="flex shrink-0 flex-col gap-3 border-b border-border p-3 lg:w-72 lg:border-r lg:border-b-0">
        <CreateMapDialog
          disabled={!writable}
          onCreated={(id) => setSelectedId(id)}
        />
        <Separator />
        {mapsQuery.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {maps.map((map) => {
              const active = map.id === selected?.id;
              return (
                <li key={map.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(map.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left font-heading text-sm font-semibold tracking-wide uppercase transition-colors",
                      active
                        ? "clip-slash bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <MapIcon className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{map.name}</span>
                    <span className="font-mono text-xs tabular-nums">
                      {map.placedCount}/{map.screenshotCount}
                    </span>
                  </button>
                </li>
              );
            })}
            {maps.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                {t("mapsEmpty")}
              </li>
            )}
          </ul>
        )}
      </aside>

      {/* Détail map */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        {!writable && (
          <div className="clip-notch-sm flex items-start gap-2.5 border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>{t("readonly")}</p>
          </div>
        )}

        {selected ? (
          <>
            <div>
              <h1 className="display text-3xl">{selected.name}</h1>
              <p className="font-mono text-xs text-muted-foreground">
                Maps/{selected.assetDir}/
              </p>
            </div>
            <FloorsPanel map={selected} disabled={!writable} />
            <Separator />
            <ScreenshotsPanel map={selected} disabled={!writable} />
          </>
        ) : (
          !mapsQuery.isLoading && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="size-8" aria-hidden />
              {t("mapsEmpty")}
            </div>
          )
        )}
      </div>
    </div>
  );
}
