import argon2 from "argon2";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

import type { CreateUserInput, UpdateUserInput } from "../schemas";
import type { AdminUser } from "../types";
import { AdminError } from "./screenshots";

interface UserRecord {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

function serializeUser(user: UserRecord, actorId: string): AdminUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as UserRole,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    isSelf: user.id === actorId,
  };
}

function isUniqueViolation(
  error: unknown,
): error is InstanceType<typeof Prisma.PrismaClientKnownRequestError> {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function uniqueMessage(error: unknown): string {
  const target =
    isUniqueViolation(error) && Array.isArray(error.meta?.target)
      ? String(error.meta.target[0])
      : "";
  return target === "username"
    ? "Ce nom d'utilisateur est déjà pris"
    : "Cet email est déjà utilisé";
}

export async function listUsers(
  search: string,
  actorId: string,
): Promise<AdminUser[]> {
  const query = search.trim();
  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return users.map((u) => serializeUser(u, actorId));
}

export async function createUser(
  input: CreateUserInput,
  actorId: string,
): Promise<AdminUser> {
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        username: input.username,
        passwordHash,
        role: input.role,
      },
    });
    return serializeUser(user, actorId);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AdminError(409, uniqueMessage(error));
    }
    throw error;
  }
}

/**
 * Garde-fous d'intégrité :
 *  - impossible de supprimer / désactiver / rétrograder le DERNIER
 *    administrateur actif — l'accès à l'admin ne peut jamais être perdu ;
 *  - impossible d'agir contre son propre compte (suppression,
 *    désactivation, retrait du rôle ADMIN) — anti-verrouillage accidentel.
 */
async function assertNotLastActiveAdmin(targetId: string) {
  const otherActiveAdmins = await prisma.user.count({
    where: { role: "ADMIN", isActive: true, id: { not: targetId } },
  });
  if (otherActiveAdmins === 0) {
    throw new AdminError(
      409,
      "Impossible : ce compte est le dernier administrateur actif",
    );
  }
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actorId: string,
): Promise<AdminUser> {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new AdminError(404, "Utilisateur introuvable");

  const demotes = input.role !== undefined && input.role !== "ADMIN";
  const deactivates = input.isActive === false;

  if (id === actorId && (demotes || deactivates)) {
    throw new AdminError(
      409,
      "Tu ne peux pas retirer tes propres droits ni désactiver ton propre compte",
    );
  }
  if (target.role === "ADMIN" && target.isActive && (demotes || deactivates)) {
    await assertNotLastActiveAdmin(id);
  }

  const data: Record<string, unknown> = {};
  if (input.email !== undefined) data.email = input.email.trim().toLowerCase();
  if (input.username !== undefined) data.username = input.username;
  if (input.role !== undefined) data.role = input.role;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.password !== undefined) {
    data.passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });
  }

  try {
    const user = await prisma.user.update({ where: { id }, data });
    return serializeUser(user, actorId);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AdminError(409, uniqueMessage(error));
    }
    throw error;
  }
}

export async function deleteUser(id: string, actorId: string): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new AdminError(404, "Utilisateur introuvable");

  if (id === actorId) {
    throw new AdminError(409, "Tu ne peux pas supprimer ton propre compte");
  }
  if (target.role === "ADMIN" && target.isActive) {
    await assertNotLastActiveAdmin(id);
  }

  await prisma.user.delete({ where: { id } });
}
