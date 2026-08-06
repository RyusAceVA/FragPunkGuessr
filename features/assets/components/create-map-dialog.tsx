"use client";

import { Loader2, Plus } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateAssetsMap } from "../api";
import { createAssetsMapSchema } from "../schemas";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface CreateMapDialogProps {
  disabled?: boolean;
  onCreated: (mapId: string) => void;
}

/** Création d'une map : la structure disque + base est générée. */
export function CreateMapDialog({ disabled, onCreated }: CreateMapDialogProps) {
  const t = useTranslations("assetsManager");
  const create = useCreateAssetsMap();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [floorCount, setFloorCount] = useState("2");
  const [error, setError] = useState<string | null>(null);

  const floorItems = [1, 2, 3, 4, 5, 6].map((n) => ({
    label: t("floorCountItem", { count: n }),
    value: String(n),
  }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createAssetsMapSchema.safeParse({
      name: name.trim(),
      code,
      floorCount: Number(floorCount),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setError(null);
    create.mutate(parsed.data, {
      onSuccess: (map) => {
        toast.success(t("createdToast", { name: map.name }), {
          description: t("createdDetail", { dir: map.assetDir }),
        });
        setOpen(false);
        setName("");
        setCode("");
        setCodeTouched(false);
        onCreated(map.id);
      },
      onError: (err) => setError(err.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        className="w-full"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Plus data-icon="inline-start" />
        {t("newMap")}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nm-name">{t("name")}</Label>
            <Input
              id="nm-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!codeTouched) setCode(slugify(e.target.value));
              }}
              placeholder="Blackmarket"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nm-code">{t("code")}</Label>
            <Input
              id="nm-code"
              value={code}
              onChange={(e) => {
                setCodeTouched(true);
                setCode(slugify(e.target.value));
              }}
              placeholder="blackmarket"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nm-floors">{t("floorCountLabel")}</Label>
            <Select
              items={floorItems}
              value={floorCount}
              onValueChange={(value) => setFloorCount(value as string)}
            >
              <SelectTrigger id="nm-floors" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {floorItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Plus data-icon="inline-start" />
            )}
            {t("createSubmit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
