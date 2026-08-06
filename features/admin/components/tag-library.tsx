"use client";

import { Library, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("workshop");
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
          <Button variant="ghost" size="icon-sm" aria-label={t("manageTags")}>
            <Library />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tagsTitle")}</DialogTitle>
          <DialogDescription>{t("tagsDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("tagsPlaceholder")}
            aria-label={t("tagsPlaceholder")}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={create.isPending}>
            <Plus data-icon="inline-start" />
            {t("tagsAdd")}
          </Button>
        </form>

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {tags.map((tag) => (
            <li key={tag.id} className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono normal-case">
                {tag.name}
              </Badge>
              <span className="flex-1 text-right font-mono text-xs text-muted-foreground tabular-nums">
                {t("tagsUsage", { count: tag.screenshotCount })}
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
                aria-label={t("tagsDelete", { name: tag.name })}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
          {tags.length === 0 && (
            <li className="py-3 text-center text-xs text-muted-foreground">
              {t("tagsEmpty")}
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
