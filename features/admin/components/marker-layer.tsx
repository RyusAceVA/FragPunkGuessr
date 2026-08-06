"use client";

import type { AdminFloor, AdminScreenshot } from "../types";
import { isPlaced } from "../types";
import { FloorMarker } from "./floor-marker";

interface MarkerLayerProps {
  floor: AdminFloor;
  screenshots: AdminScreenshot[];
  selectedId: string | null;
  /** Mode miniature actif ET zoom suffisant */
  showThumbnails: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onHoverChange: (id: string | null, element: HTMLElement | null) => void;
  clientToImage: (
    clientX: number,
    clientY: number,
  ) => { x: number; y: number } | null;
}

/** Couche des marqueurs, rendue dans le référentiel pixel du plan. */
export function MarkerLayer({
  floor,
  screenshots,
  selectedId,
  showThumbnails,
  onSelect,
  onDragEnd,
  onHoverChange,
  clientToImage,
}: MarkerLayerProps) {
  return (
    <>
      {screenshots.filter(isPlaced).map((screenshot) => (
        <FloorMarker
          key={screenshot.id}
          screenshot={screenshot}
          selected={screenshot.id === selectedId}
          showThumbnail={showThumbnails}
          floorWidth={floor.width}
          floorHeight={floor.height}
          onSelect={onSelect}
          onDragEnd={onDragEnd}
          onHoverChange={onHoverChange}
          clientToImage={clientToImage}
        />
      ))}
    </>
  );
}
