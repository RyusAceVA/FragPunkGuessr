import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

/**
 * Liaison des comptes OAuth (Google aujourd'hui, Discord/Steam demain).
 *
 * Règles, dans l'ordre :
 *  1. le couple (provider, providerAccountId) est déjà lié → ce compte ;
 *  2. l'email du provider existe déjà en base → LIAISON automatique au
 *     compte existant (l'utilisateur retrouve son profil, ses stats,
 *     son rôle — un admin qui se connecte via Google reste admin) ;
 *  3. sinon → création d'un compte USER (username dérivé de l'email,
 *     unicité garantie par suffixe).
 *
 * Un compte désactivé (isActive=false) est refusé, comme en credentials.
 */

export interface OAuthProfile {
  /** "google", "discord", "steam"… */
  provider: string;
  /** Identifiant stable chez le provider (sub OIDC) */
  providerAccountId: string;
  email: string | null;
  name: string | null;
}

export interface ResolvedOAuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

/** Username sûr et unique dérivé d'un email ou d'un nom public. */
async function deriveUsername(
  email: string | null,
  name: string | null,
): Promise<string> {
  const base =
    (email?.split("@")[0] ?? name ?? "player")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 20)
      .toLowerCase() || "player";

  for (let i = 0; ; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
}

export async function resolveOAuthUser(
  profile: OAuthProfile,
): Promise<ResolvedOAuthUser | null> {
  // 1. Compte déjà lié à ce provider
  const linked = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });
  if (linked) {
    if (!linked.user.isActive) return null;
    return {
      id: linked.user.id,
      email: linked.user.email,
      username: linked.user.username,
      role: linked.user.role as UserRole,
    };
  }

  const email = profile.email?.trim().toLowerCase() ?? null;

  // 2. Email connu → liaison au compte existant
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (!existing.isActive) return null;
      await prisma.account.create({
        data: {
          userId: existing.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      });
      return {
        id: existing.id,
        email: existing.email,
        username: existing.username,
        role: existing.role as UserRole,
      };
    }
  }

  // 3. Premier passage → création d'un compte joueur
  if (!email) return null; // un email est requis pour créer un compte
  const username = await deriveUsername(email, profile.name);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName: profile.name?.slice(0, 30) ?? null,
      role: "USER",
      accounts: {
        create: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
    },
  });
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as UserRole,
  };
}
