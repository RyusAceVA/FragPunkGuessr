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

  // --- Authentification ------------------------------------------------------
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET doit faire au moins 32 caractères (npx auth secret)"),
  // Optionnels : utilisés uniquement par `npm run admin:seed` (bootstrap du
  // premier administrateur) — l'authentification lit la table User
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
});

export const env = serverEnvSchema.parse(process.env);
