import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Argon2 est un module natif : à résoudre côté Node, jamais bundlé
  serverExternalPackages: ["argon2"],

  // Vercel : le dossier d'assets (plans + screenshots) est embarqué dans
  // le bundle des fonctions serverless — les routes /api/assets,
  // /api/game/round-image et la synchro admin lisent le disque
  outputFileTracingIncludes: {
    "/api/**": ["./Maps/**"],
  },
};

export default withNextIntl(nextConfig);
