"use client";

import { Plus, Settings2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("workshop");
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
          toast.success(t("zonesDeleted", { name: zone.name }), {
            description:
              zone.screenshotCount > 0
                ? t("zonesDeletedDetail", { count: zone.screenshotCount })
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
        aria-label={t("zonesRename", { name: zone.name })}
        className="h-8 flex-1"
      />
      <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
        {zone.screenshotCount}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={remove.isPending}
        aria-label={t("zonesDelete", { name: zone.name })}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </li>
  );
}

/** Gestion des zones de la map : créer, renommer (inline), supprimer. */
export function ZoneManager({ map }: { map: AdminMap }) {
  const t = useTranslations("workshop");
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
          <Button variant="ghost" size="icon-sm" aria-label={t("manageZones")}>
            <Settings2 />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("zonesTitle", { map: map.name })}</DialogTitle>
          <DialogDescription>{t("zonesDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("zonesPlaceholder")}
            aria-label={t("zonesPlaceholder")}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={create.isPending}>
            <Plus data-icon="inline-start" />
            {t("zonesAdd")}
          </Button>
        </form>

        <ul className="max-h-64 space-y-1.5 overflow-y-auto">
          {map.zones.map((zone) => (
            <ZoneRow key={zone.id} zone={zone} />
          ))}
          {map.zones.length === 0 && (
            <li className="py-3 text-center text-xs text-muted-foreground">
              {t("zonesEmpty")}
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
