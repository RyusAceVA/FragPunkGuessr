"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

interface UsePanZoomOptions {
  /** Dimensions du contenu (image d'origine, en pixels) */
  contentWidth: number;
  contentHeight: number;
  /** Clic simple (sans drag) — coordonnées en pixels image, non bornées */
  onTap?: (x: number, y: number) => void;
  /** Zoom maximal (échelle absolue) */
  maxScale?: number;
  /** Zoom minimal, en fraction du zoom "fit" */
  minScaleFactor?: number;
  /** En-deçà de ce déplacement (px écran), un geste est un clic */
  clickThreshold?: number;
}

/**
 * Pan/zoom fluide pour un visualiseur d'image (plan de map…).
 *
 * La transformation est appliquée impérativement (style.transform) au lieu
 * de passer par un state React : aucun re-render pendant le pan ou le zoom,
 * quel que soit le nombre de marqueurs affichés. Le niveau de zoom est
 * exposé aux marqueurs via la variable CSS `--zoom` (pour qu'ils gardent
 * une taille écran constante) et via un state throttlé pour l'UI.
 *
 * Hook générique : utilisé par l'atelier admin ET le gameplay.
 */
export function usePanZoom({
  contentWidth,
  contentHeight,
  onTap,
  maxScale = 8,
  minScaleFactor = 0.25,
  clickThreshold = 4,
}: UsePanZoomOptions) {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const transformRef = useRef<Transform>({ scale: 1, tx: 0, ty: 0 });
  const fitScaleRef = useRef(1);
  // Tant que l'utilisateur n'a pas zoomé/panné, la vue se recale
  // automatiquement sur le plan à chaque redimensionnement du conteneur
  const interactedRef = useRef(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const rafRef = useRef(0);

  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  const apply = useCallback(() => {
    const { scale, tx, ty } = transformRef.current;
    const content = contentRef.current;
    if (content) {
      content.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      content.style.setProperty("--zoom", String(scale));
    }
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setZoomPercent(Math.round(scale * 100));
    });
  }, []);

  const getTransform = useCallback(() => ({ ...transformRef.current }), []);

  /** Coordonnées écran → pixels sur l'image d'origine. */
  const clientToImage = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerEl) return null;
      const rect = containerEl.getBoundingClientRect();
      const { scale, tx, ty } = transformRef.current;
      return {
        x: (clientX - rect.left - tx) / scale,
        y: (clientY - rect.top - ty) / scale,
      };
    },
    [containerEl],
  );

  const fit = useCallback(() => {
    if (!containerEl || contentWidth <= 0 || contentHeight <= 0) return;
    const cw = containerEl.clientWidth;
    const ch = containerEl.clientHeight;
    if (cw === 0 || ch === 0) return;
    const scale = Math.min(cw / contentWidth, ch / contentHeight) * 0.97;
    fitScaleRef.current = scale;
    transformRef.current = {
      scale,
      tx: (cw - contentWidth * scale) / 2,
      ty: (ch - contentHeight * scale) / 2,
    };
    apply();
  }, [containerEl, contentWidth, contentHeight, apply]);

  const zoomAt = useCallback(
    (cx: number, cy: number, factor: number) => {
      interactedRef.current = true;
      const { scale, tx, ty } = transformRef.current;
      const minScale = fitScaleRef.current * minScaleFactor;
      const next = Math.min(Math.max(scale * factor, minScale), maxScale);
      const k = next / scale;
      transformRef.current = {
        scale: next,
        tx: cx - (cx - tx) * k,
        ty: cy - (cy - ty) * k,
      };
      apply();
    },
    [apply, maxScale, minScaleFactor],
  );

  const zoomAtCenter = useCallback(
    (factor: number) => {
      if (!containerEl) return;
      zoomAt(containerEl.clientWidth / 2, containerEl.clientHeight / 2, factor);
    },
    [containerEl, zoomAt],
  );

  // Zoom molette, centré sur le curseur. Listener natif non-passif :
  // indispensable pour pouvoir preventDefault() le scroll de la page.
  useEffect(() => {
    if (!containerEl) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = containerEl.getBoundingClientRect();
      zoomAt(
        e.clientX - rect.left,
        e.clientY - rect.top,
        Math.exp(-e.deltaY * 0.0015),
      );
    };
    containerEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => containerEl.removeEventListener("wheel", handleWheel);
  }, [containerEl, zoomAt]);

  // Ajuste la vue à chaque changement de plan
  useEffect(() => {
    interactedRef.current = false;
    fit();
  }, [fit]);

  // Recale la vue quand le conteneur obtient/change sa taille (layout
  // initial compris), tant que l'utilisateur n'a pas pris la main
  useEffect(() => {
    if (!containerEl) return;
    const observer = new ResizeObserver(() => {
      if (!interactedRef.current) fit();
    });
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl, fit]);

  // Pan à la souris (bouton gauche ou molette) + détection clic vs drag
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
    moved: boolean;
    button: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.button !== 1) return;
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointeur déjà inactif (relâché entre deux événements) : le drag
        // fonctionne quand même, seule la capture est perdue.
      }
      const { tx, ty } = transformRef.current;
      panRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTx: tx,
        startTy: ty,
        moved: false,
        button: e.button,
      };
      e.currentTarget.style.cursor = "grabbing";
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pan = panRef.current;
      if (!pan || e.pointerId !== pan.pointerId) return;
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      if (Math.abs(dx) > clickThreshold || Math.abs(dy) > clickThreshold) {
        pan.moved = true;
        interactedRef.current = true;
      }
      transformRef.current = {
        ...transformRef.current,
        tx: pan.startTx + dx,
        ty: pan.startTy + dy,
      };
      apply();
    },
    [apply, clickThreshold],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pan = panRef.current;
      if (!pan || e.pointerId !== pan.pointerId) return;
      panRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
      e.currentTarget.style.cursor = "";
      if (!pan.moved && pan.button === 0 && onTapRef.current) {
        const point = clientToImage(e.clientX, e.clientY);
        if (point) onTapRef.current(point.x, point.y);
      }
    },
    [clientToImage],
  );

  return {
    setContainerEl,
    containerEl,
    contentRef,
    zoomPercent,
    fit,
    zoomIn: () => zoomAtCenter(1.4),
    zoomOut: () => zoomAtCenter(1 / 1.4),
    getTransform,
    clientToImage,
    containerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}
