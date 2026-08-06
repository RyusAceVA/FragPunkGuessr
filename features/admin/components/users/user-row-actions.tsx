"use client";

import { KeyRound, Loader2, Trash2, UserCheck, UserX } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useDeleteUser, useUpdateUser } from "../../api";
import type { AdminUser } from "../../types";

/** Réinitialisation du mot de passe (dialog). */
function ResetPasswordDialog({ user }: { user: AdminUser }) {
  const t = useTranslations("users");
  const update = useUpdateUser();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t("passwordHint"));
      return;
    }
    update.mutate(
      { id: user.id, input: { password } },
      {
        onSuccess: () => {
          toast.success(t("resetDone", { name: user.username }));
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
              aria-label={t("resetPassword", { name: user.username })}
            >
              <KeyRound />
            </Button>
          }
        />
        <TooltipContent>{t("resetTooltip")}</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("resetTitle", { name: user.username })}</DialogTitle>
          <DialogDescription>{t("resetDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`rp-${user.id}`}>{t("password")}</Label>
            <Input
              id={`rp-${user.id}`}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordHint")}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={update.isPending}>
            {update.isPending && (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            )}
            {t("resetSubmit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Suppression avec confirmation. */
function DeleteUserDialog({ user }: { user: AdminUser }) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
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
              aria-label={t("deleteUser", { name: user.username })}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          }
        />
        <TooltipContent>
          {user.isSelf ? t("selfBlocked") : t("deleteTooltip")}
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteTitle", { name: user.username })}</DialogTitle>
          <DialogDescription>
            {t("deleteDescription", { email: user.email })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            {tCommon("cancel")}
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
                    toast.success(t("deleteDone", { email: user.email }));
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
            {t("deleteConfirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Actions d'une ligne : activer/désactiver, reset mot de passe, supprimer. */
export function UserRowActions({ user }: { user: AdminUser }) {
  const t = useTranslations("users");
  const update = useUpdateUser();

  function toggleActive() {
    update.mutate(
      { id: user.id, input: { isActive: !user.isActive } },
      {
        onSuccess: (updated) =>
          toast.success(
            updated.isActive
              ? t("reactivated", { name: updated.username })
              : t("deactivated", { name: updated.username }),
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
                  ? t("deactivate", { name: user.username })
                  : t("reactivate", { name: user.username })
              }
            >
              {user.isActive ? <UserX /> : <UserCheck />}
            </Button>
          }
        />
        <TooltipContent>
          {user.isSelf
            ? t("selfBlocked")
            : user.isActive
              ? t("deactivateHint")
              : t("reactivateHint")}
        </TooltipContent>
      </Tooltip>
      <ResetPasswordDialog user={user} />
      <DeleteUserDialog user={user} />
    </div>
  );
}
