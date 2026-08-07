import { z } from "zod";

import { gameModeSchema } from "@/types";

/** Création de partie : un mode + ses options éventuelles. */
export const createSessionSchema = z.object({
  mode: gameModeSchema.default("CLASSIC"),
  /** Map imposée (exigée par les modes requiresMap, ex. Map Training) */
  mapId: z.string().min(1).optional(),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const submitGuessSchema = z
  .object({
    roundId: z.string().min(1),
    /** Absents uniquement quand la manche expire sans réponse */
    floorId: z.string().min(1).optional(),
    pixelX: z.number().int().min(0).optional(),
    pixelY: z.number().int().min(0).optional(),
    /**
     * Temps de réponse mesuré côté client (image affichée → validation).
     * Jamais utilisé pour le verdict ni le score ; sert de garde-fou
     * aux modes chronométrés (limite dépassée = manche perdue).
     */
    timeMs: z.number().int().min(0).optional(),
    /** Time Attack : le temps est écoulé, la manche est perdue */
    timedOut: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.timedOut === true ||
      (data.floorId !== undefined &&
        data.pixelX !== undefined &&
        data.pixelY !== undefined),
  );
export type SubmitGuessInput = z.infer<typeof submitGuessSchema>;
