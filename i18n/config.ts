/**
 * Configuration i18n — SOURCE UNIQUE.
 *
 * Ajouter une langue :
 *  1. créer messages/<code>.json (copier en.json et traduire) ;
 *  2. ajouter le code dans LOCALES ci-dessous.
 * Rien d'autre — le sélecteur, le cookie et le chargement suivent.
 *
 * Préparées (fichiers à créer le moment venu) :
 *   de (Deutsch), es (Español), pt (Português),
 *   ja (日本語), ko (한국어), zh (简体中文)
 */
export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Libellé natif de chaque langue (jamais traduit). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}
