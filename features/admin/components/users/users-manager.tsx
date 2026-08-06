"use client";

import { Search, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { USER_ROLES, type UserRole } from "@/types";

import { useAdminUsers, useUpdateUser } from "../../api";
import type { AdminUser } from "../../types";
import { UserCreateDialog } from "./user-create-dialog";
import { UserRowActions } from "./user-row-actions";

const ROLE_ITEMS = USER_ROLES.map((role) => ({ label: role, value: role }));

function RoleSelect({ user }: { user: AdminUser }) {
  const t = useTranslations("users");
  const update = useUpdateUser();
  return (
    <Select
      items={ROLE_ITEMS}
      value={user.role}
      onValueChange={(value) => {
        if (value === user.role) return;
        update.mutate(
          { id: user.id, input: { role: value as UserRole } },
          {
            onSuccess: (updated) =>
              toast.success(
                t("roleChanged", {
                  name: updated.username,
                  role: updated.role,
                }),
              ),
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={t("roleAria", { name: user.username })}
        className="w-28"
      >
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
  );
}

/**
 * Administration → Utilisateurs : liste, recherche, création,
 * changement de rôle, réinitialisation de mot de passe, désactivation,
 * suppression — avec garde-fous (dernier admin, propre compte) côté serveur.
 */
export function UsersManager() {
  const t = useTranslations("users");
  const [search, setSearch] = useState("");
  const usersQuery = useAdminUsers(search);
  const users = usersQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <UserCreateDialog />
      </div>

      <div className="relative max-w-sm">
        <Search
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-8"
          aria-label={t("searchAria")}
        />
      </div>

      {usersQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : (
        <div className="panel clip-notch overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colUser")}</TableHead>
                <TableHead>{t("colRole")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead className="text-right">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className={cn(!user.isActive && "opacity-60")}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          {user.username}
                          {user.role === "ADMIN" && (
                            <ShieldCheck
                              className="size-3.5 text-primary"
                              aria-hidden
                            />
                          )}
                          {user.isSelf && (
                            <Badge variant="outline" className="text-[10px]">
                              {t("you")}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleSelect user={user} />
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="signal">{t("active")}</Badge>
                    ) : (
                      <Badge variant="destructive">{t("disabled")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <UserRowActions user={user} />
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
