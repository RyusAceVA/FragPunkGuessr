"use client";

import { Layers } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AdminFloor } from "../types";

interface FloorSelectorProps {
  floors: AdminFloor[];
  selectedFloorId: string | null;
  /** Nombre de screenshots placés par étage (id → count) */
  placedByFloor: Map<string, number>;
  onSelect: (floorId: string) => void;
}

/** Choix de l'étage, trié du plus haut au plus bas. */
export function FloorSelector({
  floors,
  selectedFloorId,
  placedByFloor,
  onSelect,
}: FloorSelectorProps) {
  const sorted = [...floors].sort((a, b) => b.level - a.level);

  return (
    <div className="space-y-1">
      {sorted.map((floor) => {
        const active = floor.id === selectedFloorId;
        const count = placedByFloor.get(floor.id) ?? 0;
        return (
          <button
            key={floor.id}
            type="button"
            onClick={() => onSelect(floor.id)}
            aria-pressed={active}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2">
              <Layers className="size-4" aria-hidden />
              {floor.name}
            </span>
            <span className="text-xs tabular-nums">{count}</span>
          </button>
        );
      })}
      {floors.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          Aucun étage — vérifie le dossier floors/ de la map.
        </p>
      )}
    </div>
  );
}
