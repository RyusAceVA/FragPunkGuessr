"use client";

import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useSyncAssets } from "../api";
import type { AdminMap } from "../types";

interface MapSelectorProps {
  maps: AdminMap[];
  selectedMapId: string | null;
  onSelect: (map: AdminMap) => void;
}

/** Choix de la map + synchronisation du dossier d'assets. */
export function MapSelector({
  maps,
  selectedMapId,
  onSelect,
}: MapSelectorProps) {
  const sync = useSyncAssets();

  function handleSync() {
    sync.mutate(undefined, {
      onSuccess: (summary) => {
        toast.success("Assets synchronisés", {
          description: `${summary.maps} map(s), ${summary.floors} étage(s), ${summary.screenshotsTotal} screenshot(s) dont ${summary.screenshotsCreated} nouveau(x).`,
        });
        summary.warnings.forEach((warning) => toast.warning(warning));
      },
      onError: (error) => toast.error(error.message),
    });
  }

  const items = maps.map((m) => ({ label: m.name, value: m.id }));

  return (
    <div className="flex items-center gap-2">
      <Select
        items={items}
        value={selectedMapId}
        onValueChange={(value) => {
          const map = maps.find((m) => m.id === value);
          if (map) onSelect(map);
        }}
      >
        <SelectTrigger className="w-full flex-1" aria-label="Choisir une map">
          <SelectValue placeholder="Choisir une map" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              onClick={handleSync}
              disabled={sync.isPending}
              aria-label="Synchroniser les assets"
            >
              <RefreshCw
                className={sync.isPending ? "animate-spin" : undefined}
              />
            </Button>
          }
        />
        <TooltipContent>Synchroniser le dossier d&apos;assets</TooltipContent>
      </Tooltip>
    </div>
  );
}
