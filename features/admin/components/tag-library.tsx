"use client";

import { Library, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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

import { useAdminTags, useCreateTag, useDeleteTag } from "../api";

/** Bibliothèque globale de tags : créer, supprimer, voir les usages. */
export function TagLibrary() {
  const tagsQuery = useAdminTags();
  const create = useCreateTag();
  const remove = useDeleteTag();
  const [draft, setDraft] = useState("");

  const tags = tagsQuery.data ?? [];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    create.mutate(
      { name },
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
            aria-label="Gérer la bibliothèque de tags"
          >
            <Library />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bibliothèque de tags</DialogTitle>
          <DialogDescription>
            Les tags sont partagés entre toutes les maps. Supprimer un tag le
            détache de tous les screenshots.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nouveau tag (angle, toit…)"
            aria-label="Nom du nouveau tag"
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={create.isPending}>
            <Plus data-icon="inline-start" />
            Ajouter
          </Button>
        </form>

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {tags.map((tag) => (
            <li key={tag.id} className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {tag.name}
              </Badge>
              <span className="flex-1 text-right text-xs text-muted-foreground tabular-nums">
                {tag.screenshotCount} usage{tag.screenshotCount > 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  remove.mutate(
                    { id: tag.id },
                    { onError: (error) => toast.error(error.message) },
                  )
                }
                disabled={remove.isPending}
                aria-label={`Supprimer le tag ${tag.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
          {tags.length === 0 && (
            <li className="py-3 text-center text-xs text-muted-foreground">
              Aucun tag pour l&apos;instant.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
