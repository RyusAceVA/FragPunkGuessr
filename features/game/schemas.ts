import { z } from "zod";

import { gameModeSchema } from "@/types";

/** Création de partie : un mode + ses options éventuelles. */
export const createSessionSchema = z.object({
  mode: gameModeSchema.default("CLASSIC"),
  /** Map imposée (exigée par les modes requiresMap, ex. Map Training) */
  mapId: z.string().min(1).optional(),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const submitGuessSchema = z.object({
  roundId: z.string().min(1),
  floorId: z.string().min(1),
  pixelX: z.number().int().min(0),
  pixelY: z.number().int().min(0),
  /**
   * Temps de réponse mesuré côté client (image affichée → validation).
   * Purement statistique — jamais utilisé pour le verdict ni le score.
   * Clampé côté serveur ; absent sur les anciens clients.
   */
  timeMs: z.number().int().min(0).optional(),
});
export type SubmitGuessInput = z.infer<typeof submitGuessSchema>;
