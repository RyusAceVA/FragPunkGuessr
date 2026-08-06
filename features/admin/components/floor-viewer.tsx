"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

import { usePanZoom } from "@/hooks/use-pan-zoom";

import { THUMBNAIL_MIN_SCALE } from "../constants";
import { assetUrl, type AdminFloor, type AdminScreenshot } from "../types";
import { FloorToolbar } from "./floor-toolbar";
import { MarkerLayer } from "./marker-layer";
import { MarkerTooltip } from "./marker-tooltip";

interface FloorViewerProps {
  floor: AdminFloor;
  /** Screenshots à afficher en marqueurs (déjà filtrés par l'appelant) */
  markers: AdminScreenshot[];
  /** Tous les screenshots placés sur cet étage (pour les compteurs) */
  placedOnFloorCount: number;
  selectedId: string | null;
  /** Un screenshot est sélectionné : le clic sur le plan le place ici */
  placingEnabled: boolean;
  showAllMarkers: boolean;
  onShowAllMarkersChange: (value: boolean) => void;
  thumbnailMode: boolean;
  onThumbnailModeChange: (value: boolean) => void;
  onPlace: (x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
}

interface HoverState {
  id: string;
  x: number;
  y: number;
}

/**
 * Visualiseur de plan : pan (drag), zoom (molette, centré curseur),
 * placement au clic, marqueurs déplaçables, tooltip de survol.
 * Le plan est rendu à sa taille native puis transformé en CSS — les
 * coordonnées DOM sont donc directement les pixels de l'image d'origine.
 */
export function FloorViewer({
  floor,
  markers,
  placedOnFloorCount,
  selectedId,
  placingEnabled,
  showAllMarkers,
  onShowAllMarkersChange,
  thumbnailMode,
  onThumbnailModeChange,
  onPlace,
  onSelect,
  onMove,
}: FloorViewerProps) {
  const t = useTranslations("workshop");
  const [hover, setHover] = useState<HoverState | null>(null);

  const handleTap = useCallback(
    (x: number, y: number) => {
      const inBounds =
        x >= 0 && y >= 0 && x <= floor.width && y <= floor.height;
      if (placingEnabled && inBounds) {
        onPlace(Math.round(x), Math.round(y));
      } else {
        onSelect(null);
      }
    },
    [floor.width, floor.height, placingEnabled, onPlace, onSelect],
  );

  const {
    setContainerEl,
    containerEl,
    contentRef,
    zoomPercent,
    fit,
    zoomIn,
    zoomOut,
    clientToImage,
    containerHandlers,
  } = usePanZoom({
    contentWidth: floor.width,
    contentHeight: floor.height,
    onTap: handleTap,
  });

  const handleHoverChange = useCallback(
    (id: string | null, element: HTMLElement | null) => {
      if (!id || !element || !containerEl) {
        setHover(null);
        return;
      }
      const markerRect = element.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      setHover({
        id,
        x: markerRect.left + markerRect.width / 2 - containerRect.left,
        y: markerRect.top - containerRect.top,
      });
    },
    [containerEl],
  );

  const hoveredScreenshot = hover
    ? (markers.find((m) => m.id === hover.id) ?? null)
    : null;

  // Miniatures uniquement quand on est assez zoomé : jamais des centaines
  // d'images à l'écran à faible zoom (les hors-champ ne sont pas chargées
  // grâce au lazy loading natif)
  const showThumbnails =
    thumbnailMode && zoomPercent >= THUMBNAIL_MIN_SCALE * 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FloorToolbar
        zoomPercent={zoomPercent}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fit}
        showAllMarkers={showAllMarkers}
        onShowAllMarkersChange={onShowAllMarkersChange}
        thumbnailMode={thumbnailMode}
        onThumbnailModeChange={onThumbnailModeChange}
        placedCount={placedOnFloorCount}
        floorName={floor.name}
      />

      <div
        ref={setContainerEl}
        {...containerHandlers}
        className={cn(
          "bg-grid relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden select-none",
          placingEnabled && "cursor-crosshair",
        )}
        data-testid="floor-viewer"
      >
        <div
          ref={contentRef}
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: floor.width, height: floor.height }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- plan rendu à taille native dans la couche zoomée */}
          <img
            src={assetUrl(floor.assetPath)}
            alt={floor.name}
            width={floor.width}
            height={floor.height}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full"
            onLoad={fit}
          />
          <MarkerLayer
            floor={floor}
            screenshots={markers}
            selectedId={selectedId}
            showThumbnails={showThumbnails}
            onSelect={onSelect}
            onDragEnd={onMove}
            onHoverChange={handleHoverChange}
            clientToImage={clientToImage}
          />
        </div>

        {hoveredScreenshot && hover && containerEl && (
          <MarkerTooltip
            screenshot={hoveredScreenshot}
            x={hover.x}
            y={hover.y}
            containerWidth={containerEl.clientWidth}
          />
        )}

        {placingEnabled && (
          <p className="glass pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            {t("placeOnPlan")}
          </p>
        )}
      </div>
    </div>
  );
}
