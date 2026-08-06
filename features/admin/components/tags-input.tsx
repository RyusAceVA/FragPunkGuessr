"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { useAdminTags } from "../api";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  id?: string;
  placeholder?: string;
  maxTags?: number;
}

/**
 * Saisie de tags : Entrée/virgule ajoute, Retour arrière (champ vide)
 * retire le dernier. Les tags existants sont suggérés sous le champ,
 * triés par usage — un clic les ajoute.
 */
export function TagsInput({
  value,
  onChange,
  id,
  placeholder,
  maxTags = 20,
}: TagsInputProps) {
  const t = useTranslations("workshop");
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const allTags = useAdminTags().data ?? [];

  const query = draft.trim().toLowerCase();
  const suggestions =
    focused && value.length < maxTags
      ? allTags
          .filter((t) => !value.includes(t.name) && t.name.includes(query))
          .slice(0, 8)
      : [];

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    setDraft("");
    if (!tag || value.includes(tag) || value.length >= maxTags) return;
    onChange([...value, tag]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          addTag(draft);
        }}
        placeholder={placeholder ?? t("tagInputPlaceholder")}
        autoComplete="off"
      />

      {suggestions.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          role="listbox"
          aria-label={t("tagInputSuggestions")}
        >
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              role="option"
              aria-selected={false}
              // preventDefault : le blur de l'input ne doit pas partir avant le clic
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(tag.name)}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {tag.name}
              <span className="ml-1 text-muted-foreground/60 tabular-nums">
                {tag.screenshotCount}
              </span>
            </button>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                aria-label={t("tagInputRemove", { name: tag })}
                className="rounded-sm p-0.5 transition-colors hover:text-destructive"
              >
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
