"use client";

import { FolderSync, ImageOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DIFFICULTIES } from "@/types";

import {
  useAdminMaps,
  useAdminScreenshots,
  useSyncAssets,
  useUpdateScreenshot,
} from "../api";
import { PROXIMITY_WARNING_DISTANCE } from "../constants";
import { useAdminStore } from "../store";
import { isPlaced, type AdminScreenshot } from "../types";
import { FloorSelector } from "./floor-selector";
import { FloorViewer } from "./floor-viewer";
import { MapSelector } from "./map-selector";
import { MetadataForm } from "./metadata-form";
import { SaveIndicator } from "./save-indicator";
import { ScreenshotList } from "./screenshot-list";
import { ScreenshotNavigator } from "./screenshot-navigator";
import { ScreenshotPreview } from "./screenshot-preview";

/**
 * Atelier de placement des screenshots — trois panneaux :
 * sélection (gauche), plan interactif (centre), édition autosave (droite).
 * Pensé pour le placement en série : après chaque placement, le prochain
 * screenshot non placé est sélectionné automatiquement.
 */
export function AdminWorkbench() {
  const t = useTranslations("workshop");
  const store = useAdminStore();
  const mapsQuery = useAdminMaps();
  const maps = useMemo(() => mapsQuery.data ?? [], [mapsQuery.data]);

  const selectedMap = maps.find((m) => m.id === store.selectedMapId) ?? null;
  const selectedFloor =
    selectedMap?.floors.find((f) => f.id === store.selectedFloorId) ?? null;

  const screenshotsQuery = useAdminScreenshots(selectedMap?.id ?? null);
  const screenshots = useMemo(
    () => screenshotsQuery.data ?? [],
    [screenshotsQuery.data],
  );
  const selectedScreenshot =
    screenshots.find((s) => s.id === store.selectedScreenshotId) ?? null;

  const update = useUpdateScreenshot();
  const sync = useSyncAssets();

  // Deep-link depuis l'Asset Manager : /admin?map=<id>&placement=1
  const searchParams = useSearchParams();
  const deepLinkMapId = searchParams.get("map");
  const deepLinkPlacement = searchParams.get("placement") === "1";
  const deepLinkDoneRef = useRef(false);

  // Auto-sélection de la première map / du premier étage au chargement
  useEffect(() => {
    if (deepLinkMapId) return; // le deep-link choisit la map
    if (!store.selectedMapId && maps.length > 0) {
      const first = maps[0];
      store.selectMap(first.id, first.floors[0]?.id ?? null);
    }
  }, [maps, store, deepLinkMapId]);

  // Étape 1 du deep-link : sélectionner la map demandée
  useEffect(() => {
    if (!deepLinkMapId || deepLinkDoneRef.current || maps.length === 0) return;
    const map = maps.find((m) => m.id === deepLinkMapId);
    if (!map) return;
    if (store.selectedMapId !== map.id) {
      store.selectMap(map.id, map.floors[0]?.id ?? null);
    }
    if (!deepLinkPlacement) deepLinkDoneRef.current = true;
  }, [deepLinkMapId, deepLinkPlacement, maps, store]);

  // Étape 2 : ouvrir le premier screenshot non placé (placement en série)
  useEffect(() => {
    if (
      !deepLinkMapId ||
      !deepLinkPlacement ||
      deepLinkDoneRef.current ||
      store.selectedMapId !== deepLinkMapId ||
      !screenshotsQuery.data
    ) {
      return;
    }
    deepLinkDoneRef.current = true;
    const firstUnplaced = screenshotsQuery.data
      .filter((s) => !isPlaced(s))
      .sort((a, b) => a.code.localeCompare(b.code))[0];
    if (firstUnplaced) store.selectScreenshot(firstUnplaced.id);
  }, [deepLinkMapId, deepLinkPlacement, screenshotsQuery.data, store]);

  const placedByFloor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of screenshots) {
      if (isPlaced(s)) counts.set(s.floorId, (counts.get(s.floorId) ?? 0) + 1);
    }
    return counts;
  }, [screenshots]);

  const unplaced = useMemo(
    () => screenshots.filter((s) => !isPlaced(s)),
    [screenshots],
  );

  // Marqueurs affichés : tous les placés de l'étage, ou seulement la sélection
  const markers = useMemo(() => {
    if (!selectedFloor) return [];
    return screenshots.filter(
      (s) =>
        isPlaced(s) &&
        s.floorId === selectedFloor.id &&
        (store.showAllMarkers || s.id === store.selectedScreenshotId),
    );
  }, [
    screenshots,
    selectedFloor,
    store.showAllMarkers,
    store.selectedScreenshotId,
  ]);

  // ---- Navigation ---------------------------------------------------------

  function selectScreenshot(screenshot: AdminScreenshot) {
    store.selectScreenshot(screenshot.id);
    // Si le screenshot est placé sur un autre étage, on bascule dessus
    if (isPlaced(screenshot) && screenshot.floorId !== store.selectedFloorId) {
      store.selectFloor(screenshot.floorId);
    }
  }

  function navigate(delta: number) {
    if (screenshots.length === 0) return;
    const index = screenshots.findIndex(
      (s) => s.id === store.selectedScreenshotId,
    );
    const next =
      index === -1
        ? screenshots[delta > 0 ? 0 : screenshots.length - 1]
        : screenshots[
            (index + delta + screenshots.length) % screenshots.length
          ];
    selectScreenshot(next);
  }

  function selectRandomUnplaced() {
    if (unplaced.length === 0) {
      toast.info(t("allPlaced"));
      return;
    }
    const pick = unplaced[Math.floor(Math.random() * unplaced.length)];
    store.selectScreenshot(pick.id);
  }

  /** Prochain non placé après `code` (ordre des codes, cyclique). */
  function nextUnplacedAfter(code: string, excludeId: string) {
    const candidates = unplaced.filter((s) => s.id !== excludeId);
    if (candidates.length === 0) return null;
    return candidates.find((s) => s.code > code) ?? candidates[0];
  }

  // ---- Mutations ----------------------------------------------------------

  function warnIfTooClose(screenshot: AdminScreenshot, x: number, y: number) {
    if (!selectedFloor) return;
    let nearest: { code: string; distance: number } | null = null;
    for (const s of screenshots) {
      if (s.id === screenshot.id || !isPlaced(s)) continue;
      if (s.floorId !== selectedFloor.id) continue;
      const distance = Math.hypot(s.pixelX - x, s.pixelY - y);
      if (distance < PROXIMITY_WARNING_DISTANCE) {
        if (!nearest || distance < nearest.distance) {
          nearest = { code: s.code, distance };
        }
      }
    }
    if (nearest) {
      toast.warning(t("proximityTitle"), {
        id: "proximity-warning",
        description: t("proximityDetail", {
          code: nearest.code,
          distance: Math.round(nearest.distance),
        }),
      });
    }
  }

  function mutatePlacement(screenshot: AdminScreenshot, x: number, y: number) {
    if (!selectedMap || !selectedFloor) return;
    warnIfTooClose(screenshot, x, y);
    update.mutate(
      {
        id: screenshot.id,
        mapId: selectedMap.id,
        input: {
          placement: { floorId: selectedFloor.id, pixelX: x, pixelY: y },
        },
      },
      { onError: (error) => toast.error(error.message) },
    );
  }

  function handlePlace(x: number, y: number) {
    if (!selectedScreenshot) return;
    const wasUnplaced = !isPlaced(selectedScreenshot);
    mutatePlacement(selectedScreenshot, x, y);
    // Placement en série : on passe directement au prochain non placé
    if (wasUnplaced) {
      const next = nextUnplacedAfter(
        selectedScreenshot.code,
        selectedScreenshot.id,
      );
      if (next) store.selectScreenshot(next.id);
    }
  }

  function handleMove(id: string, x: number, y: number) {
    const screenshot = screenshots.find((s) => s.id === id);
    if (screenshot) {
      store.selectScreenshot(id);
      mutatePlacement(screenshot, x, y);
    }
  }

  // ---- Raccourcis clavier -------------------------------------------------

  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandlerRef.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        "input, textarea, select, [contenteditable='true'], [role='combobox'], [role='listbox'], [role='dialog']",
      )
    ) {
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigate(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      navigate(1);
    } else if (e.key === "r" || e.key === "R") {
      selectRandomUnplaced();
    } else if (e.key === "Escape") {
      store.selectScreenshot(null);
    } else if (selectedScreenshot && selectedMap) {
      const difficultyIndex = ["1", "2", "3", "4"].indexOf(e.key);
      if (difficultyIndex !== -1 || e.key === "0") {
        update.mutate(
          {
            id: selectedScreenshot.id,
            mapId: selectedMap.id,
            input: {
              difficulty: e.key === "0" ? null : DIFFICULTIES[difficultyIndex],
            },
          },
          { onError: (error) => toast.error(error.message) },
        );
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        isPlaced(selectedScreenshot)
      ) {
        e.preventDefault();
        update.mutate(
          {
            id: selectedScreenshot.id,
            mapId: selectedMap.id,
            input: { placement: null },
          },
          { onError: (error) => toast.error(error.message) },
        );
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ---- États vides --------------------------------------------------------

  if (mapsQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }

  if (maps.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <FolderSync className="size-10 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="display text-2xl">{t("emptyTitle")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
        <Button
          onClick={() =>
            sync.mutate(undefined, {
              onSuccess: (s) =>
                toast.success(
                  t("syncShort", { maps: s.maps, total: s.screenshotsTotal }),
                ),
              onError: (error) => toast.error(error.message),
            })
          }
          disabled={sync.isPending}
          className="glow-primary"
        >
          <FolderSync data-icon="inline-start" />
          {t("sync")}
        </Button>
      </div>
    );
  }

  // ---- Atelier ------------------------------------------------------------

  const selectedIndex = screenshots.findIndex(
    (s) => s.id === store.selectedScreenshotId,
  );

  return (
    <div className="flex h-full flex-col xl:grid xl:grid-cols-[300px_minmax(0,1fr)_360px]">
      {/* Colonne gauche : map, étage, screenshots */}
      <aside className="flex min-h-0 flex-col gap-3 border-b border-border p-3 xl:border-r xl:border-b-0">
        <MapSelector
          maps={maps}
          selectedMapId={store.selectedMapId}
          onSelect={(map) => store.selectMap(map.id, map.floors[0]?.id ?? null)}
        />
        {selectedMap && (
          <>
            <FloorSelector
              floors={selectedMap.floors}
              selectedFloorId={store.selectedFloorId}
              placedByFloor={placedByFloor}
              onSelect={store.selectFloor}
            />
            <Separator />
            <ScreenshotList
              screenshots={screenshots}
              floors={selectedMap.floors}
              selectedId={store.selectedScreenshotId}
              filter={store.filter}
              search={store.search}
              onFilterChange={store.setFilter}
              onSearchChange={store.setSearch}
              onSelect={selectScreenshot}
            />
          </>
        )}
      </aside>

      {/* Centre : plan interactif */}
      <section className="flex h-[60vh] min-h-0 flex-col xl:h-auto">
        {selectedFloor ? (
          <FloorViewer
            key={selectedFloor.id}
            floor={selectedFloor}
            markers={markers}
            placedOnFloorCount={placedByFloor.get(selectedFloor.id) ?? 0}
            selectedId={store.selectedScreenshotId}
            placingEnabled={selectedScreenshot !== null}
            showAllMarkers={store.showAllMarkers}
            onShowAllMarkersChange={store.setShowAllMarkers}
            thumbnailMode={store.thumbnailMode}
            onThumbnailModeChange={store.setThumbnailMode}
            onPlace={handlePlace}
            onSelect={store.selectScreenshot}
            onMove={handleMove}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {t("selectFloor")}
          </div>
        )}
      </section>

      {/* Colonne droite : navigation, prévisualisation, édition autosave */}
      <aside className="flex min-h-0 flex-col border-t border-border xl:border-t-0 xl:border-l">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <ScreenshotNavigator
            position={selectedIndex + 1}
            total={screenshots.length}
            unplacedCount={unplaced.length}
            onPrevious={() => navigate(-1)}
            onNext={() => navigate(1)}
            onRandomUnplaced={selectRandomUnplaced}
          />
          <SaveIndicator />
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
          {selectedScreenshot && selectedMap ? (
            <>
              <ScreenshotPreview screenshot={selectedScreenshot} />
              <MetadataForm
                key={selectedScreenshot.id}
                screenshot={selectedScreenshot}
                map={selectedMap}
              />
            </>
          ) : (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <ImageOff className="size-6" aria-hidden />
              <p>{t("selectPrompt")}</p>
              <p className="text-xs">{t("shortcuts")}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
