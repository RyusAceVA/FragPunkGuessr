"use client";

import { MapPinOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from "@/types";

import { useAutosave } from "../hooks/use-autosave";
import { isPlaced, type AdminMap, type AdminScreenshot } from "../types";
import { TagLibrary } from "./tag-library";
import { TagsInput } from "./tags-input";
import { ZoneManager } from "./zone-manager";

const UNSET = "__UNSET__";
const NO_ZONE = "__NONE__";

const DIFFICULTY_ITEMS = [
  { label: "Non renseignée", value: UNSET },
  ...DIFFICULTIES.map((d) => ({ label: DIFFICULTY_LABELS[d], value: d })),
];

interface MetadataFormProps {
  /** ⚠ le composant doit être monté avec key={screenshot.id} */
  screenshot: AdminScreenshot;
  map: AdminMap;
}

/**
 * Éditeur du screenshot sélectionné — tout est sauvegardé automatiquement.
 * Les champs discrets (selects, checkbox, tags) sont dérivés des props :
 * la mutation optimiste met le cache à jour instantanément, donc ils
 * restent synchronisés même quand un raccourci clavier modifie la valeur.
 * Seule la saisie libre (orientation, notes) vit en état local, avec
 * debounce ; le hook d'autosave flush au démontage (`key` par screenshot).
 */
export function MetadataForm({ screenshot, map }: MetadataFormProps) {
  const { save } = useAutosave(screenshot.id, map.id);

  const [orientation, setOrientation] = useState(
    screenshot.orientation !== null ? String(screenshot.orientation) : "",
  );
  const [orientationInvalid, setOrientationInvalid] = useState(false);
  const [notes, setNotes] = useState(screenshot.notes ?? "");

  const zoneItems = [
    { label: "Sans zone", value: NO_ZONE },
    ...map.zones.map((z) => ({ label: z.name, value: z.id })),
  ];

  function handleOrientationChange(raw: string) {
    setOrientation(raw);
    if (raw.trim() === "") {
      setOrientationInvalid(false);
      save({ orientation: null }, 500);
      return;
    }
    const parsed = Number(raw);
    const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 359;
    setOrientationInvalid(!valid);
    if (valid) save({ orientation: parsed }, 500);
  }

  return (
    <div className="space-y-4">
      {/* Placement (pixels sur l'image d'origine du plan) */}
      <div className="rounded-lg border border-border bg-card/50 p-3 text-xs">
        {isPlaced(screenshot) ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">
              {map.floors.find((f) => f.id === screenshot.floorId)?.name ?? "?"}{" "}
              —{" "}
              <span className="font-mono text-foreground">
                x:{screenshot.pixelX} y:{screenshot.pixelY}
              </span>
            </span>
            <Button
              type="button"
              variant="destructive"
              size="xs"
              onClick={() => save({ placement: null }, 0)}
            >
              <MapPinOff data-icon="inline-start" />
              Retirer
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Non placé — clique sur le plan pour créer le marqueur.
          </p>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="meta-difficulty">Difficulté</Label>
          <Select
            items={DIFFICULTY_ITEMS}
            value={screenshot.difficulty ?? UNSET}
            onValueChange={(value) => {
              save(
                { difficulty: value === UNSET ? null : (value as Difficulty) },
                0,
              );
            }}
          >
            <SelectTrigger id="meta-difficulty" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-orientation">Orientation (°)</Label>
          <Input
            id="meta-orientation"
            inputMode="numeric"
            placeholder="0-359"
            value={orientation}
            onChange={(e) => handleOrientationChange(e.target.value)}
            aria-invalid={orientationInvalid}
          />
        </div>
      </div>
      {orientationInvalid && (
        <p className="-mt-2 text-xs text-destructive">
          Entier entre 0 et 359 attendu.
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meta-zone">Zone</Label>
          <ZoneManager map={map} />
        </div>
        <Select
          items={zoneItems}
          value={screenshot.zoneId ?? NO_ZONE}
          onValueChange={(value) => {
            const zone = map.zones.find((z) => z.id === value) ?? null;
            save(
              {
                zoneId: value === NO_ZONE ? null : (value as string),
                zoneName: zone?.name ?? null,
              },
              0,
            );
          }}
        >
          <SelectTrigger id="meta-zone" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zoneItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meta-tags">Tags</Label>
          <TagLibrary />
        </div>
        <TagsInput
          id="meta-tags"
          value={screenshot.tags}
          onChange={(next) => {
            save({ tags: next }, 0);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta-notes">Commentaires internes</Label>
        <Textarea
          id="meta-notes"
          rows={3}
          placeholder="Angle piégeux, à revérifier après le patch…"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            save({ notes: e.target.value.trim() || null }, 800);
          }}
        />
      </div>
    </div>
  );
}
