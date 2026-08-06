import type { NextAuthConfig } from "next-auth";

/**
 * Configuration Auth.js SANS provider — importable par le middleware
 * (runtime Edge) : aucune dépendance Node (Argon2, Prisma) ici.
 * Le provider Credentials est ajouté dans auth.ts (runtime Node).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    // JWT signé dans un cookie httpOnly (Secure en production) —
    // aucune session en base nécessaire pour l'admin d'environnement
    strategy: "jwt",
    // Durée de session : 12 heures
    maxAge: 60 * 60 * 12,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    // Le rôle voyage dans le JWT : le middleware Edge peut vérifier
    // ADMIN sans toucher à la base
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
