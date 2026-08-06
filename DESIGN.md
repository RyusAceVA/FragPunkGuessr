# Design System — « Ink & Signal » v2

Identité visuelle de FragPunk Guessr. Recettes extraites de la DA du
site officiel fragpunk.com (fond violet encre, CTA holographiques
lime/cyan, slabs violets inclinés, typographies techno) — **jamais** de
reprise directe d'éléments graphiques officiels.
Tout composant du site se construit exclusivement avec ces tokens
(`app/globals.css`) et les primitives `components/ui/*`.

## 1. Principes

| Principe   | Traduction concrète                                            |
| ---------- | -------------------------------------------------------------- |
| Encre      | Fond violet très sombre, vignettes pourpres, bandes en coin    |
| Signal     | Rose punk (identité) · lime acide (action) · cyan (info)       |
| Holo       | CTA et titres forts en dégradé irisé lime/menthe/cyan          |
| Tranché    | Angles vifs, coins entaillés (`notch`), diagonales (`slash`)   |
| Print      | Ombres dures décalées (jamais de flou), textures halftone/scan |
| Hiérarchie | Display condensé DROIT capitales vs corps techno               |

## 2. Palette (oklch)

| Token               | Valeur               | Usage                             |
| ------------------- | -------------------- | --------------------------------- |
| `background`        | `0.16 0.033 296`     | Fond violet encre                 |
| `foreground`        | `0.96 0.006 90`      | Texte « papier »                  |
| `card`              | `0.2 0.038 296`      | Surfaces                          |
| `primary`           | `0.67 0.24 345` rose | Identité, focus, sélection        |
| `signal` (lime)     | `0.9 0.24 127`       | Réussite, énergie, éclats CTA     |
| `info` (cyan)       | `0.8 0.12 210`       | Information neutre, pin du joueur |
| `grape` / `-bright` | `0.5–0.6 0.21+ 296`  | Slabs, bandes de coin, décors     |
| `destructive`       | `0.62 0.22 28`       | Danger, erreurs                   |
| `muted` / `accent`  | `0.25–0.29`          | Fonds discrets, hovers            |
| `border`            | `foreground / 12%`   | Traits fins à fort contraste      |

Règle : les signaux sont des **accents** (boutons, badges, pins, traits),
jamais des fonds de section.

## 3. Typographies

| Rôle      | Fonte        | Classe            | Usage                         |
| --------- | ------------ | ----------------- | ----------------------------- |
| Display   | Oswald       | `.display`        | Titres héros (droits, caps)   |
| Display   | Oswald       | `.font-heading`   | Titres, boutons, badges, tabs |
| Étiquette | Oswald       | `.overline-label` | Sur-titres techniques espacés |
| Corps     | Chakra Petch | (défaut)          | Paragraphes, formulaires      |
| Données   | Geist Mono   | `.font-mono`      | Coordonnées, codes, compteurs |

Les variables `next/font` sont posées sur `<html>` (jamais sur `<body>` :
`font-sans` est appliqué sur `html`, qui ne voit pas les variables de son
enfant). Titres forts : ajouter `.text-holo` sur le segment à iriser.

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
| `.hard-shadow`         | Ombre print 4×4 px encre (panneaux)            |
| `.drop-ink`            | Ombre dure APRÈS découpe (suit le clip-path)   |
| `.hard-shadow-primary` | Ombre rose                                     |
| Press                  | Boutons : `active` = translation 3 px, ombre 0 |

**CTA holographique** (recette des boutons officiels) : `.holo-fill`
(dégradé irisé lime/menthe/cyan, texte encre, glissement du dégradé au
hover) + `.clip-cta` (coins tranchés opposés) + `.drop-ink`. Éclats
triangulaires : envelopper d'un `<span class="cta-shards">`. Slab de
titre : `.slab` (bandeau violet incliné). Bandes de coin : `.corner-bands`
sur un conteneur **positionné**.

## 6. Textures & fonds

`.bg-grid` (grille tactique), `.texture-halftone` (trame de points),
`.texture-scan` (scanlines), `.stripes-primary` (hachures diagonales),
`.slash-divider` (séparateur diagonal), `.mask-fade-edges`,
`.vignette-grape` (vignettes pourpres), `.corner-bands` (bandes violettes
diagonales haut/bas, signature des fonds officiels).
Textures ≤ 7 % d'opacité — la texture se devine, ne se voit pas.

## 6bis. Écran de chargement (manche)

`ScreenshotView` télécharge l'image en flux et affiche un écran de
chargement plein cadre (fond encre + bandes de coin + logo pulsant +
« Loading… (N %) » avec progression réelle via Content-Length). Le chrome
de jeu (bouton Deviner) reste masqué tant que l'image n'est pas affichée.

## 7. Animations

Framer Motion. Durées : 150 ms (micro), 300–400 ms (entrées), ressort
`stiffness 380 / damping 36` (panneaux). Règles : une seule intention par
mouvement, `useReducedMotion` respecté (`FadeIn`), jamais d'animation en
boucle hors chargement.

## 8. Icônes

`lucide-react` exclusivement, taille 16 px (`size-4`) dans les contrôles,
`data-icon="inline-start|inline-end"` dans les boutons.

## 9. Composants (components/ui)

`Button` (default **holo** lime irisé découpé / accent rose / secondary
papier / outline / ghost / destructive — capitales condensées, press
physique ; taille `xl` pour les CTA héros),
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
