import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authConfig } from "./auth.config";
import { loginSchema } from "./schemas";
import { verifyCredentials } from "./server/credentials";
import { resolveOAuthUser } from "./server/oauth";

/** Google n'est proposé que si ses clés sont configurées (Vercel/.env). */
export const isGoogleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/**
 * Instance Auth.js complète (runtime Node) : config partagée +
 * Credentials (Argon2) + Google (liaison/création automatique).
 * La stratégie reste 100 % JWT — aucune session en base.
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return verifyCredentials(parsed.data.email, parsed.data.password);
      },
    }),
    ...(isGoogleEnabled ? [Google] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Connexion OAuth : résout (ou crée) l'utilisateur LOCAL et écrase
     * id/nom sur l'objet user pour que le JWT porte NOTRE identifiant,
     * jamais celui du provider. Credentials passe tel quel (authorize
     * a déjà tout vérifié).
     */
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;

      const resolved = await resolveOAuthUser({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        email: profile?.email ?? user.email ?? null,
        name: profile?.name ?? user.name ?? null,
      });
      if (!resolved) return false; // compte désactivé ou email absent

      user.id = resolved.id;
      user.email = resolved.email;
      user.name = resolved.username;
      user.role = resolved.role;
      return true;
    },
    // Étend le jwt de base : force token.sub = id local (OAuth compris)
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        if (user.id) token.sub = user.id;
      }
      return token;
    },
  },
});
