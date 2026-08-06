"use client";

import { KeyRound, Loader2, Trash2, UserCheck, UserX } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useDeleteUser, useUpdateUser } from "../../api";
import type { AdminUser } from "../../types";

/** Réinitialisation du mot de passe (dialog). */
function ResetPasswordDialog({ user }: { user: AdminUser }) {
  const update = useUpdateUser();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("8 caractères minimum");
      return;
    }
    update.mutate(
      { id: user.id, input: { password } },
      {
        onSuccess: () => {
          toast.success(`Mot de passe de ${user.username} réinitialisé`);
          setOpen(false);
          setPassword("");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(true)}
              aria-label={`Réinitialiser le mot de passe de ${user.username}`}
            >
              <KeyRound />
            </Button>
          }
        />
        <TooltipContent>Réinitialiser le mot de passe</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau mot de passe — {user.username}</DialogTitle>
          <DialogDescription>
            Note-le avant de valider : il ne sera plus affiché (seul son hash
            Argon2id est conservé).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`rp-${user.id}`}>Mot de passe</Label>
            <Input
              id={`rp-${user.id}`}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={update.isPending}>
            {update.isPending && (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            )}
            Réinitialiser
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Suppression avec confirmation. */
function DeleteUserDialog({ user }: { user: AdminUser }) {
  const remove = useDeleteUser();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(true)}
              disabled={user.isSelf}
              aria-label={`Supprimer ${user.username}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          }
        />
        <TooltipContent>
          {user.isSelf ? "Impossible sur ton propre compte" : "Supprimer"}
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer {user.username} ?</DialogTitle>
          <DialogDescription>
            Le compte {user.email} sera définitivement supprimé. Ses parties
            anonymisées sont conservées.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(
                { id: user.id },
                {
                  onSuccess: () => {
                    toast.success(`Compte ${user.email} supprimé`);
                    setOpen(false);
                  },
                  onError: (error) => toast.error(error.message),
                },
              )
            }
          >
            {remove.isPending && (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            )}
            Supprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Actions d'une ligne : activer/désactiver, reset mot de passe, supprimer. */
export function UserRowActions({ user }: { user: AdminUser }) {
  const update = useUpdateUser();

  function toggleActive() {
    update.mutate(
      { id: user.id, input: { isActive: !user.isActive } },
      {
        onSuccess: (updated) =>
          toast.success(
            updated.isActive
              ? `Compte ${updated.username} réactivé`
              : `Compte ${updated.username} désactivé`,
          ),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleActive}
              disabled={update.isPending || user.isSelf}
              aria-label={
                user.isActive
                  ? `Désactiver ${user.username}`
                  : `Réactiver ${user.username}`
              }
            >
              {user.isActive ? <UserX /> : <UserCheck />}
            </Button>
          }
        />
        <TooltipContent>
          {user.isSelf
            ? "Impossible sur ton propre compte"
            : user.isActive
              ? "Désactiver (connexion refusée)"
              : "Réactiver"}
        </TooltipContent>
      </Tooltip>
      <ResetPasswordDialog user={user} />
      <DeleteUserDialog user={user} />
    </div>
  );
}
