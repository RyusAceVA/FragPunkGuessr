"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson, jsonInit } from "@/lib/fetch-json";

import type { ProfileData } from "../types";
import { AvatarPicker } from "./avatar-picker";

/**
 * Édition du profil : displayName, avatar, country, bio.
 * L'username et l'email sont affichés mais non modifiables ici.
 */
export function ProfileForm({ initial }: { initial: ProfileData }) {
  const t = useTranslations("profile");
  const format = useFormatter();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [country, setCountry] = useState(initial.country ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");

  const saveMutation = useMutation({
    mutationFn: () =>
      fetchJson<ProfileData>(
        "/api/profile",
        jsonInit("PATCH", { displayName, avatarUrl, country, bio }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(t("saved"));
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        saveMutation.mutate();
      }}
    >
      {/* Identité — lecture seule */}
      <div className="panel clip-notch-sm flex flex-wrap items-center gap-4 p-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- API d'assets externe
          <img
            src={avatarUrl}
            alt=""
            className="size-16 shrink-0 rounded-sm border border-border object-cover"
          />
        ) : (
          <span className="clip-slash flex size-16 shrink-0 items-center justify-center bg-primary/15 font-heading text-2xl font-bold text-primary uppercase">
            {initial.username.slice(0, 2)}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-heading text-xl font-bold uppercase">
            {initial.username}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {initial.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("memberSince", {
              date: format.dateTime(new Date(initial.createdAt), {
                dateStyle: "long",
              }),
            })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("avatar")}</Label>
        <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-display-name">{t("displayName")}</Label>
          <Input
            id="profile-display-name"
            value={displayName}
            maxLength={30}
            placeholder={initial.username}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-country">{t("country")}</Label>
          <Input
            id="profile-country"
            value={country}
            maxLength={56}
            placeholder={t("countryPlaceholder")}
            onChange={(event) => setCountry(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-bio">{t("bio")}</Label>
        <Textarea
          id="profile-bio"
          value={bio}
          maxLength={280}
          rows={3}
          placeholder={t("bioPlaceholder")}
          onChange={(event) => setBio(event.target.value)}
        />
        <p className="text-right text-xs text-muted-foreground tabular-nums">
          {bio.length}/280
        </p>
      </div>

      <Button type="submit" size="lg" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <Save data-icon="inline-start" />
        )}
        {t("save")}
      </Button>
    </form>
  );
}
