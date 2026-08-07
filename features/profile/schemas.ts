import { z } from "zod";

/**
 * Les avatars proviennent exclusivement de l'API d'assets communautaire
 * (portraits de lancers) — jamais d'URL arbitraire en base.
 */
export const AVATAR_URL_PREFIX =
  "https://raw.githubusercontent.com/RyusAceVA/fragpunk-assets/";

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/** Mise à jour du profil — l'email n'est PAS modifiable ici. */
export const updateProfileSchema = z.object({
  displayName: z.string().max(30).transform(emptyToNull),
  avatarUrl: z
    .union([z.string().startsWith(AVATAR_URL_PREFIX).max(300), z.null()])
    .optional(),
  country: z.string().max(56).transform(emptyToNull),
  bio: z.string().max(280).transform(emptyToNull),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
