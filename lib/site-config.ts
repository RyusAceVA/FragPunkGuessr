/**
 * Configuration globale du site : identité, navigation, URLs.
 * Source de vérité unique pour tout ce qui est affiché dans le chrome
 * de l'application (navbar, footer, metadata).
 */
export const siteConfig = {
  name: "FragPunk Guessr",
  tagline: "Reconnais la map. Place ton guess. Frag la précision.",
  description:
    "Le jeu de géo-guessing dédié à FragPunk : identifie l'endroit exact d'un screenshot sur les maps du jeu et grimpe au classement.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: readonly NavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/play", label: "Jouer" },
  { href: "/stats", label: "Stats" },
  { href: "/admin", label: "Admin" },
] as const;
