import argon2 from "argon2";

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Vérifie un couple email / mot de passe contre la table User.
 *
 * SOURCE UNIQUE de vérité pour l'authentification — tous les comptes
 * (administrateurs comme futurs joueurs) vivent en base :
 *  - mots de passe en hash Argon2id uniquement ;
 *  - un compte désactivé (isActive=false) ne peut pas se connecter ;
 *  - le premier admin est créé par `npm run admin:seed`.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user?.passwordHash || !user.isActive) return null;

  const valid = await argon2
    .verify(user.passwordHash, password)
    .catch(() => false);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.username,
    role: user.role as UserRole,
  };
}
