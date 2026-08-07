"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { assetUrl } from "@/lib/assets";
import { fetchJson } from "@/lib/fetch-json";

import type { HeatmapData, HeatmapFloor } from "../types";

/**
 * Rendu canvas de la heatmap : chaque erreur est un dégradé radial
 * additif (composition "lighter") à la position réelle du screenshot,
 * d'intensité proportionnelle à la gravité. Dessiné UNE fois par
 * chargement — aucune boucle d'animation, aucun coût au scroll/zoom.
 */
function drawHeatmap(canvas: HTMLCanvasElement, data: HeatmapData) {
  const { width, height } = data.floor;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  const radius = Math.hypot(width, height) * 0.045;
  for (const point of data.points) {
    if (point.weight <= 0.02) continue; // manches quasi parfaites : rien
    const r = radius * (0.55 + point.weight * 0.7);
    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      r,
    );
    const alpha = 0.25 + point.weight * 0.5;
    gradient.addColorStop(0, `rgba(244, 56, 90, ${alpha})`);
    gradient.addColorStop(0.55, `rgba(244, 90, 40, ${alpha * 0.45})`);
    gradient.addColorStop(1, "rgba(244, 90, 40, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Heatmap des erreurs, étage par étage. */
export function ErrorHeatmap({ floors }: { floors: HeatmapFloor[] }) {
  const t = useTranslations("stats.heatmap");
  const [floorId, setFloorId] = useState(floors[0]?.floorId ?? null);

  const items = useMemo(
    () =>
      floors.map((floor) => ({
        // Noms map/étage — jamais traduits
        label: `${floor.mapName} · ${floor.floorName}`,
        value: floor.floorId,
      })),
    [floors],
  );

  const heatmapQuery = useQuery({
    queryKey: ["stats", "heatmap", floorId],
    queryFn: () => fetchJson<HeatmapData>(`/api/stats/heatmap/${floorId}`),
    enabled: floorId !== null,
    staleTime: 60_000,
  });
  const data = heatmapQuery.data;

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas && data) drawHeatmap(canvas, data);
    },
    [data],
  );

  if (floors.length === 0) {
    return (
      <div className="panel clip-notch p-6 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  const selected = floors.find((f) => f.floorId === floorId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          items={items}
          value={floorId}
          onValueChange={(value) => setFloorId(value as string)}
        >
          <SelectTrigger className="w-56" aria-label={t("floorLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <span className="text-xs text-muted-foreground">
            {t("roundsOn", { count: selected.roundsPlayed })}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {t("legendLow")}
          <span
            className="h-2 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(244,90,40,0.55), rgba(244,56,90,0.95))",
            }}
            aria-hidden
          />
          {t("legendHigh")}
        </span>
      </div>

      <div className="panel clip-notch relative overflow-hidden bg-black/30">
        {data ? (
          <div className="relative mx-auto w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element -- plan servi par l'API d'assets */}
            <img
              src={assetUrl(data.floor.assetPath)}
              alt={`${data.floor.mapName} · ${data.floor.name}`}
              width={data.floor.width}
              height={data.floor.height}
              className="h-auto max-h-[65vh] w-auto max-w-full opacity-80 select-none"
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden
            />
          </div>
        ) : (
          <Skeleton className="aspect-square w-full" />
        )}
      </div>
    </div>
  );
}
