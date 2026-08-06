"use client";

import { useRef, useState } from "react";

import { MapPin } from "@/components/map-pin";

const DRAG_THRESHOLD = 4;

interface GuessMarkerProps {
  x: number;
  y: number;
  color: string;
  floorWidth: number;
  floorHeight: number;
  /** Fin de drag — coordonnées bornées au plan */
  onMove: (x: number, y: number) => void;
  clientToImage: (
    clientX: number,
    clientY: number,
  ) => { x: number; y: number } | null;
}

/**
 * Le pin du joueur : pointe = coordonnée choisie, taille écran constante
 * (échelle inverse ancrée sur la pointe), déplaçable au drag.
 */
export function GuessMarker({
  x,
  y,
  color,
  floorWidth,
  floorHeight,
  onMove,
  clientToImage,
}: GuessMarkerProps) {
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const px = dragPos?.x ?? x;
  const py = dragPos?.y ?? y;

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (
      Math.abs(e.clientX - drag.startX) > DRAG_THRESHOLD ||
      Math.abs(e.clientY - drag.startY) > DRAG_THRESHOLD
    ) {
      drag.moved = true;
    }
    if (!drag.moved) return;
    const point = clientToImage(e.clientX, e.clientY);
    if (point) {
      setDragPos({
        x: Math.round(Math.min(Math.max(point.x, 0), floorWidth)),
        y: Math.round(Math.min(Math.max(point.y, 0), floorHeight)),
      });
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (drag.moved && dragPos) onMove(dragPos.x, dragPos.y);
    setDragPos(null);
  }

  return (
    <button
      type="button"
      aria-label="Ton pin — déplaçable"
      className="absolute z-10 cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white active:cursor-grabbing"
      style={{ left: px, top: py, width: 0, height: 0 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <span
        className="relative block"
        style={{
          transform: "scale(calc(1 / var(--zoom, 1)))",
          transformOrigin: "0 0",
        }}
      >
        <span className="absolute" style={{ left: -14, top: -35 }}>
          <MapPin color={color} glow={dragPos !== null} />
        </span>
      </span>
    </button>
  );
}
