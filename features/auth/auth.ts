import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { loginSchema } from "./schemas";
import { verifyCredentials } from "./server/credentials";

/**
 * Instance Auth.js complète (runtime Node) : config partagée +
 * provider Credentials avec vérification Argon2.
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
  ],
});
