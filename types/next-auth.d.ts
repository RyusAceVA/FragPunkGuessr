import type { DefaultSession } from "next-auth";

import type { UserRole } from "./game";

/**
 * Augmentation des types Auth.js : le rôle voyage du provider
 * jusqu'à la session via le JWT.
 * (Le JWT des callbacks provient de @auth/core — les deux chemins de
 * module sont augmentés.)
 */
declare module "next-auth" {
  interface User {
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole;
  }
}
