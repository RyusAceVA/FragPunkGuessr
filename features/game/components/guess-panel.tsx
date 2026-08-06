"use client";

import { motion } from "framer-motion";
import { Check, ChevronLeft, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { usePlayableMaps } from "../api";
import { useGameStore } from "../store";
import { GuessMap } from "./guess-map";
import { MapPicker } from "./map-picker";

interface GuessPanelProps {
  isValidating: boolean;
  onValidate: () => void;
}

/**
 * Panneau de réponse en deux étapes obligatoires :
 * 1. identifier la map (aucune n'est présélectionnée) ;
 * 2. choisir l'étage et poser le pin sur le plan.
 * Fermer le panneau conserve toute la réponse en cours.
 */
export function GuessPanel({ isValidating, onValidate }: GuessPanelProps) {
  const t = useTranslations("play.panel");
  const guessMapId = useGameStore((s) => s.guessMapId);
  const guessFloorId = useGameStore((s) => s.guessFloorId);
  const pin = useGameStore((s) => s.pin);
  const selectGuessMap = useGameStore((s) => s.selectGuessMap);
  const clearGuessMap = useGameStore((s) => s.clearGuessMap);
  const selectGuessFloor = useGameStore((s) => s.selectGuessFloor);
  const setPanelOpen = useGameStore((s) => s.setPanelOpen);

  const mapsQuery = usePlayableMaps();
  const maps = mapsQuery.data ?? [];
  const selectedMap = maps.find((m) => m.id === guessMapId) ?? null;
  const floors = selectedMap
    ? [...selectedMap.floors].sort((a, b) => b.level - a.level)
    : [];
  const selectedFloor =
    selectedMap?.floors.find((f) => f.id === guessFloorId) ??
    selectedMap?.floors[0] ??
    null;

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      className="glass absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l sm:w-[min(480px,90vw)]"
      aria-label={t("whichMap")}
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-3">
        {selectedMap ? (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearGuessMap}
              aria-label={t("changeMap")}
            >
              <ChevronLeft />
            </Button>
            <h2 className="flex-1 truncate font-heading text-lg font-bold tracking-wide uppercase">
              {selectedMap.name}
            </h2>
          </>
        ) : (
          <h2 className="flex-1 px-1 font-heading text-lg font-bold tracking-wide uppercase">
            {t("whichMap")}
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setPanelOpen(false)}
          aria-label={t("close")}
        >
          <X />
        </Button>
      </header>

      {!selectedMap ? (
        <MapPicker
          maps={maps}
          isLoading={mapsQuery.isLoading}
          onPick={(map) => selectGuessMap(map.id, map.floors[0]?.id ?? null)}
        />
      ) : (
        <>
          {selectedMap.floors.length > 1 && (
            <div
              className="flex gap-1 border-b border-border p-2"
              role="radiogroup"
              aria-label={t("floorChoice")}
            >
              {floors.map((floor) => {
                const active = floor.id === selectedFloor?.id;
                return (
                  <button
                    key={floor.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => selectGuessFloor(floor.id)}
                    className={cn(
                      "flex-1 px-3 py-1.5 font-heading text-sm font-semibold tracking-wide uppercase transition-colors",
                      active
                        ? "clip-slash bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {floor.name}
                  </button>
                );
              })}
            </div>
          )}

          {selectedFloor && (
            <GuessMap key={selectedFloor.id} floor={selectedFloor} />
          )}

          <footer className="space-y-2 border-t border-border p-3">
            <Button
              className="glow-primary w-full"
              size="lg"
              disabled={!pin || isValidating}
              onClick={onValidate}
            >
              {isValidating ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Check data-icon="inline-start" />
              )}
              {t("validate")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t("stillEditable")}
            </p>
          </footer>
        </>
      )}
    </motion.aside>
  );
}
