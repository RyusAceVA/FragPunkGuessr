import { z } from "zod";

export const createAssetsMapSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "2 caractères minimum")
    .max(50, "50 caractères maximum"),
  code: z
    .string()
    .trim()
    .min(2, "2 caractères minimum")
    .max(30, "30 caractères maximum")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Minuscules, chiffres et tirets uniquement (ex. itzamna)",
    ),
  /** Indicatif — sert de repère dans l'interface, les étages réels sont
   *  créés à l'import des plans */
  floorCount: z.number().int().min(1).max(10).optional(),
});
export type CreateAssetsMapInput = z.infer<typeof createAssetsMapSchema>;

export const UPLOAD_KINDS = ["floor", "screenshot"] as const;
export const uploadKindSchema = z.enum(UPLOAD_KINDS);
export type UploadKind = z.infer<typeof uploadKindSchema>;
