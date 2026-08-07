import { z } from "zod";

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
