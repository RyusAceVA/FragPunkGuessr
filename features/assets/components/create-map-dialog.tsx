"use client";

import { Loader2, Plus } from "lucide-react";
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

const FLOOR_COUNT_ITEMS = [1, 2, 3, 4, 5, 6].map((n) => ({
  label: `${n} étage${n > 1 ? "s" : ""}`,
  value: String(n),
}));

interface CreateMapDialogProps {
  disabled?: boolean;
  onCreated: (mapId: string) => void;
}

/** Création d'une map : la structure disque + base est générée. */
export function CreateMapDialog({ disabled, onCreated }: CreateMapDialogProps) {
  const create = useCreateAssetsMap();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [floorCount, setFloorCount] = useState("2");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createAssetsMapSchema.safeParse({
      name: name.trim(),
      code,
      floorCount: Number(floorCount),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setError(null);
    create.mutate(parsed.data, {
      onSuccess: (map) => {
        toast.success(`Map « ${map.name} » créée`, {
          description: `Structure ${map.assetDir}/floors + screenshots prête — importe les plans.`,
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
        className="glow-primary w-full"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Plus data-icon="inline-start" />
        Nouvelle map
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une map</DialogTitle>
          <DialogDescription>
            La structure de dossiers (plans, screenshots, miniatures) est créée
            automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nm-name">Nom</Label>
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
            <Label htmlFor="nm-code">Code (dossier)</Label>
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
            <Label htmlFor="nm-floors">Nombre d&apos;étages (indicatif)</Label>
            <Select
              items={FLOOR_COUNT_ITEMS}
              value={floorCount}
              onValueChange={(value) => setFloorCount(value as string)}
            >
              <SelectTrigger id="nm-floors" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLOOR_COUNT_ITEMS.map((item) => (
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
            Créer la map
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
