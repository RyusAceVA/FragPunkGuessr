import argon2 from "argon2";

import { prisma } from "@/lib/prisma";

import type { RegisterInput } from "../schemas";

/** Codes d'erreur d'inscription, traduits côté client. */
export type RegisterErrorCode =
  "invalid" | "passwordMismatch" | "usernameTaken" | "emailTaken";

/**
 * Crée un compte joueur (rôle USER, hash Argon2id).
 * Renvoie null en cas de succès, un code d'erreur i18n sinon.
 * Les admins, eux, restent créés depuis le panneau Administration.
 */
export async function registerUser(
  input: RegisterInput,
): Promise<RegisterErrorCode | null> {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();

  const [emailTaken, usernameTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({
      where: { username },
      select: { id: true },
    }),
  ]);
  if (emailTaken) return "emailTaken";
  if (usernameTaken) return "usernameTaken";

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  await prisma.user.create({
    data: { email, username, passwordHash, role: "USER" },
  });
  return null;
}
