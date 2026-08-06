"use client";

import {
  Crosshair,
  FolderOpen,
  Layers,
  Lock,
  Map as MapIcon,
} from "lucide-react";
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
  const queue = useUploadQueue(map.id, "floor");
  const floors = [...map.floors].sort((a, b) => b.level - a.level);

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
        <Layers className="size-4 text-primary" aria-hidden />
        Plans d&apos;étages
        <span className="text-xs font-normal text-muted-foreground">
          {floors.length} importé{floors.length > 1 ? "s" : ""}
        </span>
      </h2>

      {floors.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {floors.map((floor) => (
            <li key={floor.id}>
              <Badge variant="secondary" className="font-mono">
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
        label="Dépose les plans ici (ou clique)"
        hint="L'étage est détecté par le nom : 1F, 2F, 3F, B1, B2, RDC, Roof, Basement…"
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
  const router = useRouter();
  const queue = useUploadQueue(map.id, "screenshot");
  const unplaced = map.screenshotCount - map.placedCount;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
          <Crosshair className="size-4 text-neon-cyan" aria-hidden />
          Screenshots
          <span className="text-xs font-normal text-muted-foreground">
            {map.screenshotCount} importé{map.screenshotCount > 1 ? "s" : ""} ·{" "}
            {map.placedCount} placé{map.placedCount > 1 ? "s" : ""}
          </span>
        </h2>
        {unplaced > 0 && (
          <Button
            size="sm"
            className="glow-primary"
            onClick={() => router.push(`/admin?map=${map.id}&placement=1`)}
          >
            <Crosshair data-icon="inline-start" />
            Commencer le placement ({unplaced})
          </Button>
        )}
      </div>

      <Dropzone
        onFiles={(files) => void queue.start(files)}
        disabled={disabled || queue.isUploading || map.floors.length === 0}
        label={
          map.floors.length === 0
            ? "Importe d'abord au moins un plan d'étage"
            : "Dépose les screenshots ici — 1 ou 500 fichiers"
        }
        hint="Copie + miniature + entrée en base pour chaque fichier. Aucun écrasement : les doublons de nom sont suffixés."
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
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <MapIcon className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{map.name}</span>
                    <span className="text-xs tabular-nums">
                      {map.placedCount}/{map.screenshotCount}
                    </span>
                  </button>
                </li>
              );
            })}
            {maps.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                Aucune map — crée la première.
              </li>
            )}
          </ul>
        )}
      </aside>

      {/* Détail map */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        {!writable && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Cet hébergement ne permet pas d&apos;écrire les fichiers (système
              en lecture seule). Importe les assets <strong>en local</strong>,
              puis <code>git commit + push</code> pour les déployer.
            </p>
          </div>
        )}

        {selected ? (
          <>
            <div>
              <h1 className="font-heading text-2xl font-bold">
                {selected.name}
              </h1>
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
              Crée ta première map pour commencer.
            </div>
          )
        )}
      </div>
    </div>
  );
}
