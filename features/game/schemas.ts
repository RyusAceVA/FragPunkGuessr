import { z } from "zod";

export const submitGuessSchema = z.object({
  roundId: z.string().min(1),
  floorId: z.string().min(1),
  pixelX: z.number().int().min(0),
  pixelY: z.number().int().min(0),
});
export type SubmitGuessInput = z.infer<typeof submitGuessSchema>;
