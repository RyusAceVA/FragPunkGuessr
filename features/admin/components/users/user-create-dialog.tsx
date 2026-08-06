"use client";

import { Loader2, Plus, UserPlus } from "lucide-react";
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
import { USER_ROLES, type UserRole } from "@/types";

import { useCreateUser } from "../../api";
import { createUserSchema } from "../../schemas";

const ROLE_ITEMS = USER_ROLES.map((role) => ({ label: role, value: role }));

/** Création d'un compte (ex. l'accès administrateur du client). */
export function UserCreateDialog() {
  const create = useCreateUser();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createUserSchema.safeParse({
      email,
      username,
      password,
      role,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setError(null);
    create.mutate(parsed.data, {
      onSuccess: (user) => {
        toast.success(`Compte ${user.email} créé (${user.role})`);
        setOpen(false);
        setEmail("");
        setUsername("");
        setPassword("");
        setRole("ADMIN");
      },
      onError: (err) => setError(err.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="glow-primary" onClick={() => setOpen(true)}>
        <UserPlus data-icon="inline-start" />
        Créer un utilisateur
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Le mot de passe est hashé (Argon2id) — note-le avant de valider, il
            ne sera plus affiché.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nu-email">Email</Label>
            <Input
              id="nu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@exemple.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-username">Nom d&apos;utilisateur</Label>
            <Input
              id="nu-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="client"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-password">Mot de passe</Label>
            <Input
              id="nu-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-role">Rôle</Label>
            <Select
              items={ROLE_ITEMS}
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
            >
              <SelectTrigger id="nu-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_ITEMS.map((item) => (
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
            Créer le compte
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
