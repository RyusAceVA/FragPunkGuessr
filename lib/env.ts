import { z } from "zod";

/**
 * Variables d'environnement serveur, validées au démarrage.
 * ⚠️ À n'importer que depuis du code serveur (ex. lib/prisma.ts).
 * Une variable manquante fait échouer le boot immédiatement plutôt
 * qu'au premier accès à la base.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  ASSETS_DIR: z.string().min(1).default("Maps"),

  // --- Authentification (admin) ---------------------------------------------
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET doit faire au moins 32 caractères (npx auth secret)"),
  ADMIN_EMAIL: z.email("ADMIN_EMAIL doit être un email valide"),
  ADMIN_PASSWORD_HASH: z
    .string()
    .startsWith(
      "$argon2",
      "ADMIN_PASSWORD_HASH doit être un hash Argon2 (npm run admin:hash)",
    ),
});

export const env = serverEnvSchema.parse(process.env);
