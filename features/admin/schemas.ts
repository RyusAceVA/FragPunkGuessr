import { z } from "zod";

import { difficultySchema } from "@/types";

/**
 * Schémas de validation du domaine admin — réutilisés côté client
 * (mutations) ET côté serveur (routes API).
 */

/** Position d'un screenshot, en PIXELS sur l'image d'origine du plan. */
export const placementSchema = z.object({
  floorId: z.string().min(1),
  pixelX: z.number().int().min(0),
  pixelY: z.number().int().min(0),
});
export type PlacementInput = z.infer<typeof placementSchema>;

/**
 * Mise à jour partielle d'un screenshot (autosave envoie uniquement
 * les champs modifiés). `placement`/`zoneId`/`difficulty`/`orientation` :
 * undefined = ne pas toucher, null = effacer.
 */
export const updateScreenshotSchema = z.object({
  placement: placementSchema.nullable().optional(),
  difficulty: difficultySchema.nullable().optional(),
  orientation: z.number().int().min(0).max(359).nullable().optional(),
  zoneId: z.string().min(1).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
});
export type UpdateScreenshotInput = z.infer<typeof updateScreenshotSchema>;

export const zoneNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est requis")
  .max(40, "40 caractères maximum");

export const createZoneSchema = z.object({
  mapId: z.string().min(1),
  name: zoneNameSchema,
});
export type CreateZoneInput = z.infer<typeof createZoneSchema>;

export const renameZoneSchema = z.object({ name: zoneNameSchema });

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(30),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;
