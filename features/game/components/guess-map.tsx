"use client";

import { Maximize, Minus, Plus } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { usePanZoom } from "@/hooks/use-pan-zoom";
import { assetUrl } from "@/lib/assets";

import { PLAYER_PIN_COLOR } from "../constants";
import { useGameStore } from "../store";
import type { GameFloor } from "../types";
import { GuessMarker } from "./guess-marker";

/**
 * Étapes 4-5 : le plan interactif du panneau de guess.
 * Clic = poser/replacer le pin ; le pin lui-même est déplaçable ;
 * pan/zoom identiques au reste de l'app (molette centrée curseur).
 */
export function GuessMap({ floor }: { floor: GameFloor }) {
  const pin = useGameStore((s) => s.pin);
  const placePin = useGameStore((s) => s.placePin);

  const handleTap = useCallback(
    (x: number, y: number) => {
      if (x < 0 || y < 0 || x > floor.width || y > floor.height) return;
      placePin(Math.round(x), Math.round(y));
    },
    [floor.width, floor.height, placePin],
  );

  const {
    setContainerEl,
    contentRef,
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

  return (
    <div
      ref={setContainerEl}
      {...containerHandlers}
      className="bg-grid relative min-h-0 flex-1 cursor-crosshair touch-none overflow-hidden select-none"
      data-testid="guess-map"
    >
      <div
        ref={contentRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: floor.width, height: floor.height }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- plan rendu à taille native dans la couche zoomée */}
        <img
          src={assetUrl(floor.assetPath)}
          alt={`Plan ${floor.name}`}
          width={floor.width}
          height={floor.height}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full"
          onLoad={fit}
        />
        {pin && (
          <GuessMarker
            x={pin.x}
            y={pin.y}
            color={PLAYER_PIN_COLOR}
            floorWidth={floor.width}
            floorHeight={floor.height}
            onMove={placePin}
            clientToImage={clientToImage}
          />
        )}
      </div>

      {/* Contrôles de zoom */}
      <div className="glass absolute right-2 bottom-2 z-20 flex items-center gap-0.5 rounded-lg p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={zoomOut}
          aria-label="Zoom arrière"
        >
          <Minus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={zoomIn}
          aria-label="Zoom avant"
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={fit}
          aria-label="Ajuster à l'écran"
        >
          <Maximize />
        </Button>
      </div>

      {!pin && (
        <p className="glass pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground">
          Clique sur le plan pour poser ton pin
        </p>
      )}
    </div>
  );
}
