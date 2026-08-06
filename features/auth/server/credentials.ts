import argon2 from "argon2";

import { env } from "@/lib/env";
import type { UserRole } from "@/types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Vérifie un couple email / mot de passe.
 *
 * SOURCE UNIQUE de vérité pour l'authentification :
 *  1. l'administrateur d'environnement (ADMIN_EMAIL + ADMIN_PASSWORD_HASH,
 *     hash Argon2id — jamais de mot de passe en clair) ;
 *  2. (futur) les comptes joueurs en base — il suffira d'ajouter ici :
 *       const user = await prisma.user.findUnique({ where: { email } });
 *       if (user?.passwordHash &&
 *           await argon2.verify(user.passwordHash, password)) {
 *         return { id: user.id, email: user.email, name: user.username,
 *                  role: user.role as UserRole };
 *       }
 *     Rien d'autre ne change : même provider, même session, même middleware.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  if (email.trim().toLowerCase() === env.ADMIN_EMAIL.toLowerCase()) {
    const valid = await argon2
      .verify(env.ADMIN_PASSWORD_HASH, password)
      .catch(() => false);
    if (valid) {
      return {
        id: "env-admin",
        email: env.ADMIN_EMAIL,
        name: "Administrateur",
        role: "ADMIN",
      };
    }
  }
  return null;
}
