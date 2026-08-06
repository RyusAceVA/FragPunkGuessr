# Design System — « Ink & Signal »

Identité visuelle de FragPunk Guessr. Inspirée des principes de la DA
FragPunk (énergie, contrastes francs, géométrie tranchée, esprit print
punk) — **jamais** de reprise directe d'éléments graphiques officiels.
Tout composant du site se construit exclusivement avec ces tokens
(`app/globals.css`) et les primitives `components/ui/*`.

## 1. Principes

| Principe   | Traduction concrète                                            |
| ---------- | -------------------------------------------------------------- |
| Encre      | Fond noir chaud, texte blanc papier, aplats francs             |
| Signal     | 3 accents saturés réservés au sens (action / réussite / info)  |
| Tranché    | Angles vifs, coins entaillés (`notch`), diagonales (`slash`)   |
| Print      | Ombres dures décalées (jamais de flou), textures halftone/scan |
| Hiérarchie | Display condensé italique capitales vs corps sobre             |

## 2. Palette (oklch)

| Token              | Valeur                  | Usage                             |
| ------------------ | ----------------------- | --------------------------------- |
| `background`       | `0.145 0.01 300`        | Fond encre                        |
| `foreground`       | `0.955 0.006 90`        | Texte « papier »                  |
| `card`             | `0.185 0.012 300`       | Surfaces                          |
| `primary`          | `0.64 0.25 358` magenta | Actions, focus, sélection         |
| `signal` (lime)    | `0.88 0.2 128`          | Réussite, énergie, mise en avant  |
| `info` (cyan)      | `0.8 0.12 210`          | Information neutre, pin du joueur |
| `destructive`      | `0.62 0.22 28`          | Danger, erreurs                   |
| `muted` / `accent` | `0.23–0.26`             | Fonds discrets, hovers            |
| `border`           | `foreground / 12%`      | Traits fins à fort contraste      |

Règle : les signaux sont des **accents** (boutons, badges, pins, traits),
jamais des fonds de section.

## 3. Typographies

| Rôle      | Fonte            | Classe            | Usage                         |
| --------- | ---------------- | ----------------- | ----------------------------- |
| Display   | Barlow Condensed | `.display`        | Titres héros (italique, caps) |
| Display   | Barlow Condensed | `.font-heading`   | Titres, boutons, badges, tabs |
| Étiquette | Barlow Condensed | `.overline-label` | Sur-titres techniques espacés |
| Corps     | Manrope          | (défaut)          | Paragraphes, formulaires      |
| Données   | Geist Mono       | `.font-mono`      | Coordonnées, codes, compteurs |

## 4. Espacement, tailles, rayons

- Grille de **4 px** (échelle Tailwind) ; gouttières de page `px-4 sm:px-6`,
  largeur max `max-w-6xl` (marketing) / plein écran (outils).
- Rayons : `--radius: 0.5rem` — les composants utilisent `rounded-sm`
  (angles quasi vifs). Les coins « signature » sont **entaillés**, pas
  arrondis : `.clip-notch` (14 px), `.clip-notch-sm` (8 px), `.clip-slash`
  (parallélogramme des badges).

## 5. Ombres & reliefs

| Classe                 | Effet                                          |
| ---------------------- | ---------------------------------------------- |
| `.hard-shadow`         | Ombre print 4×4 px encre (boutons, panneaux)   |
| `.hard-shadow-primary` | Ombre magenta                                  |
| `.glow-primary`        | CTA principal : ombre dure + halo magenta      |
| Press                  | Boutons : `active` = translation 3 px, ombre 0 |

## 6. Textures & fonds

`.bg-grid` (grille tactique), `.texture-halftone` (trame de points),
`.texture-scan` (scanlines), `.stripes-primary` (hachures diagonales),
`.slash-divider` (séparateur diagonal), `.mask-fade-edges`.
Toujours ≤ 7 % d'opacité — la texture se devine, ne se voit pas.

## 7. Animations

Framer Motion. Durées : 150 ms (micro), 300–400 ms (entrées), ressort
`stiffness 380 / damping 36` (panneaux). Règles : une seule intention par
mouvement, `useReducedMotion` respecté (`FadeIn`), jamais d'animation en
boucle hors chargement.

## 8. Icônes

`lucide-react` exclusivement, taille 16 px (`size-4`) dans les contrôles,
`data-icon="inline-start|inline-end"` dans les boutons.

## 9. Composants (components/ui)

`Button` (default magenta / secondary papier / outline / ghost /
destructive — capitales condensées, ombre dure, press physique),
`Badge` (sticker incliné `clip-slash` + variantes), `Card` (surface
`clip-notch`), `Input`/`Textarea`/`Select` (traits fins, focus magenta),
`Dialog` (panneau entaillé), `Tabs` (actif magenta), `Table` (en-têtes
overline), `Checkbox`, `Tooltip`, `Skeleton`, `Sonner`.
Composés maison : `MapPin`, `Artwork`, `Dropzone`, `UploadProgress`,
`SaveIndicator`, viewers pan/zoom.

## 10. Illustrations (sans code)

`public/branding/branding.json` mappe des **slots** (`home.hero`,
`play.start`…) vers des URLs — API communautaire
`raw.githubusercontent.com/RyusAceVA/fragpunk-assets/main/…` ou fichiers
locaux `public/branding/`. `src: null` → fallback halftone automatique.
Composant : `<Artwork slot="home.hero" />`.

## 11. Internationalisation

Aucune chaîne dans les composants : tout vit dans `messages/<locale>.json`
(next-intl, ICU). Langue par cookie (défaut `en`). Jamais traduits : noms
de maps, noms d'étages, assets. Ajouter une langue : voir `i18n/config.ts`.
