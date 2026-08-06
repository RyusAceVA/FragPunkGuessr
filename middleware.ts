import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/features/auth/auth.config";

/**
 * Protection centralisée de l'administration (runtime Edge) :
 *  - non authentifié  → /login (pages) ou 401 JSON (API)
 *  - authentifié sans rôle ADMIN → page 403 (pages) ou 403 JSON (API)
 * Le rôle est lu dans le JWT signé — aucune requête base de données.
 * Aucune page ni route ne doit revérifier les droits individuellement.
 */
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (!request.auth?.user) {
    if (isApi) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (request.auth.user.role !== "ADMIN") {
    if (isApi) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.rewrite(new URL("/403", request.nextUrl), {
      status: 403,
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
