"use client";

import { Plus, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useCreateZone, useDeleteZone, useRenameZone } from "../api";
import type { AdminMap, AdminZone } from "../types";

function ZoneRow({ zone }: { zone: AdminZone }) {
  const rename = useRenameZone();
  const remove = useDeleteZone();
  const [name, setName] = useState(zone.name);

  function commitRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === zone.name) {
      setName(zone.name);
      return;
    }
    rename.mutate(
      { id: zone.id, name: trimmed },
      {
        onError: (error) => {
          setName(zone.name);
          toast.error(error.message);
        },
      },
    );
  }

  function handleDelete() {
    remove.mutate(
      { id: zone.id },
      {
        onSuccess: () =>
          toast.success(`Zone « ${zone.name} » supprimée`, {
            description:
              zone.screenshotCount > 0
                ? `${zone.screenshotCount} screenshot(s) repassent sans zone.`
                : undefined,
          }),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <li className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setName(zone.name);
        }}
        aria-label={`Renommer la zone ${zone.name}`}
        className="h-8 flex-1"
      />
      <span className="w-8 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {zone.screenshotCount}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={remove.isPending}
        aria-label={`Supprimer la zone ${zone.name}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </li>
  );
}

/** Gestion des zones de la map : créer, renommer (inline), supprimer. */
export function ZoneManager({ map }: { map: AdminMap }) {
  const create = useCreateZone();
  const [draft, setDraft] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    create.mutate(
      { mapId: map.id, name },
      {
        onSuccess: () => setDraft(""),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Gérer les zones de la map"
          >
            <Settings2 />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zones — {map.name}</DialogTitle>
          <DialogDescription>
            Renomme une zone directement dans son champ. La suppression ne
            supprime aucun screenshot : ils repassent « sans zone ».
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nouvelle zone (Spawn, Mid, Site A…)"
            aria-label="Nom de la nouvelle zone"
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={create.isPending}>
            <Plus data-icon="inline-start" />
            Ajouter
          </Button>
        </form>

        <ul className="max-h-64 space-y-1.5 overflow-y-auto">
          {map.zones.map((zone) => (
            <ZoneRow key={zone.id} zone={zone} />
          ))}
          {map.zones.length === 0 && (
            <li className="py-3 text-center text-xs text-muted-foreground">
              Aucune zone pour l&apos;instant.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
