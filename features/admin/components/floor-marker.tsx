"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import {
  CLICK_MOVE_THRESHOLD,
  difficultyStyle,
  PIN_EDITING_COLOR,
  PIN_SELECTED_COLOR,
} from "../constants";
import { assetUrl, type AdminScreenshot } from "../types";

interface FloorMarkerProps {
  screenshot: AdminScreenshot & { pixelX: number; pixelY: number };
  selected: boolean;
  /** Miniature affichée au-dessus du pin (mode miniature + zoom suffisant) */
  showThumbnail: boolean;
  floorWidth: number;
  floorHeight: number;
  onSelect: (id: string) => void;
  /** Fin de drag — coordonnées en pixels image, déjà bornées au plan */
  onDragEnd: (id: string, x: number, y: number) => void;
  onHoverChange: (id: string | null, element: HTMLElement | null) => void;
  clientToImage: (
    clientX: number,
    clientY: number,
  ) => { x: number; y: number } | null;
}

/**
 * Pin dont la POINTE désigne exactement (pixelX, pixelY).
 * Le `scale(calc(1/var(--zoom)))` (origine = pointe) annule le zoom du
 * plan : taille écran constante à tous les niveaux de zoom.
 * Couleurs : blanc = non renseigné, vert/jaune/orange/rouge = difficulté,
 * bleu = sélectionné, violet = en cours de déplacement.
 */
export function FloorMarker({
  screenshot,
  selected,
  showThumbnail,
  floorWidth,
  floorHeight,
  onSelect,
  onDragEnd,
  onHoverChange,
  clientToImage,
}: FloorMarkerProps) {
  const t = useTranslations("workshop");
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const x = dragPos?.x ?? screenshot.pixelX;
  const y = dragPos?.y ?? screenshot.pixelY;
  const editing = dragPos !== null;
  const color = editing
    ? PIN_EDITING_COLOR
    : selected
      ? PIN_SELECTED_COLOR
      : difficultyStyle(screenshot.difficulty).pin;

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
    onHoverChange(null, null);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (
      Math.abs(e.clientX - drag.startX) > CLICK_MOVE_THRESHOLD ||
      Math.abs(e.clientY - drag.startY) > CLICK_MOVE_THRESHOLD
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
    if (drag.moved && dragPos) {
      onDragEnd(screenshot.id, dragPos.x, dragPos.y);
    } else {
      onSelect(screenshot.id);
    }
    setDragPos(null);
  }

  return (
    <button
      type="button"
      aria-label={t("markerAria", { code: screenshot.code })}
      aria-pressed={selected}
      className="absolute cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white active:cursor-grabbing"
      style={{
        left: x,
        top: y,
        width: 0,
        height: 0,
        zIndex: selected ? 20 : 10,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={(e) => onHoverChange(screenshot.id, e.currentTarget)}
      onPointerLeave={() => onHoverChange(null, null)}
    >
      {/* Échelle inverse ancrée sur la pointe : le pin garde sa taille écran */}
      <span
        className="relative block"
        style={{
          transform: "scale(calc(1 / var(--zoom, 1)))",
          transformOrigin: "0 0",
        }}
      >
        {showThumbnail && (
          /* eslint-disable-next-line @next/next/no-img-element -- miniature d'asset locale */
          <img
            src={assetUrl(screenshot.assetPath)}
            alt=""
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute max-w-none rounded-md border-2 bg-black/60 object-cover shadow-lg"
            style={{
              left: -48,
              top: -92,
              width: 96,
              height: 54,
              borderColor: color,
            }}
          />
        )}
        <svg
          width="28"
          height="36"
          viewBox="0 0 28 36"
          className="absolute transition-transform duration-100"
          style={{
            left: -14,
            top: -35,
            transform: editing ? "scale(1.15)" : undefined,
            transformOrigin: "14px 35px",
            filter:
              selected || editing
                ? `drop-shadow(0 0 6px ${color})`
                : "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
          }}
          aria-hidden
        >
          <path
            d="M14 35 C 14 35 3.5 20.5 3.5 13 A 10.5 10.5 0 1 1 24.5 13 C 24.5 20.5 14 35 14 35 Z"
            fill={color}
            stroke="rgba(0, 0, 0, 0.55)"
            strokeWidth="1"
          />
          <circle cx="14" cy="13" r="4" fill="rgba(12, 10, 20, 0.85)" />
        </svg>
      </span>
    </button>
  );
}
