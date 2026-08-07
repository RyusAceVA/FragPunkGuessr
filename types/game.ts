import { z } from "zod";

/**
 * Unions métier partagées.
 * SQLite ne supporte pas les enums Prisma : ces champs sont des String
 * en base, contraints ici par des z.enum. Lors du passage à PostgreSQL,
 * ils pourront devenir des enums natifs sans toucher au reste du code.
 */

export const USER_ROLES = ["USER", "ADMIN"] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "IMPOSSIBLE"] as const;
export const difficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof difficultySchema>;

/**
 * Modes de jeu déclarés. Un mode déclaré ici peut exister en base et
 * dans les statistiques ; il n'est JOUABLE que s'il est enregistré
 * dans le registre des modes (features/game/modes/registry.ts).
 * TIME_ATTACK est déclaré par anticipation (stats prêtes), pas encore
 * implémenté.
 */
export const GAME_MODES = [
  "CLASSIC",
  "MAP_TRAINING",
  "TIME_ATTACK",
  "DAILY",
] as const;
export const gameModeSchema = z.enum(GAME_MODES);
export type GameMode = z.infer<typeof gameModeSchema>;

export const SESSION_STATUSES = [
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
] as const;
export const sessionStatusSchema = z.enum(SESSION_STATUSES);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
