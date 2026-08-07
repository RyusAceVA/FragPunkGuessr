# FragPunk Guessr

Plateforme de géo-guessing dédiée à FragPunk : un screenshot, un plan de map,
un pin — le joueur reconnaît la map, retrouve l'endroit exact et marque des
points selon sa précision.

> Projet communautaire, non affilié à Bad Guitar Studio.

## Stack

- **Next.js 15** (App Router, Turbopack) + **React 19** + **TypeScript** strict
- **TailwindCSS v4** + **shadcn/ui** — Design System « Ink & Signal »
  documenté dans [`DESIGN.md`](DESIGN.md)
- **next-intl** (sans routing) — interface **EN** (défaut) / **FR**, locale
  persistée en cookie ; catalogues dans `messages/`
- **PostgreSQL** (Neon en production) via **Prisma 7** (driver adapter `pg`)
- **Auth.js v5** (NextAuth) — sessions JWT en cookies httpOnly, mots de passe
  hashés **Argon2id**
- **React Query** (état serveur) / **Zustand** (état UI client)
- **React Hook Form + Zod** / **Framer Motion**

---

## Installation (développement)

```bash
git clone <repo> && cd FragGuessr
npm install                 # installe + génère le client Prisma

cp .env.example .env        # puis remplir (voir ci-dessous)

npm run db:dev              # démarre un Postgres local (Prisma Dev)
npx prisma dev ls           # → copier l'URL "TCP" dans DATABASE_URL (.env)
npm run db:migrate          # applique les migrations

npm run dev                 # http://localhost:3000
```

Ensuite : se connecter sur `/login`, ouvrir `/admin`, cliquer
**Synchroniser les assets**, placer les screenshots — et jouer sur `/play`.

### Variables d'environnement

| Variable              | Rôle                                                      |
| --------------------- | --------------------------------------------------------- |
| `DATABASE_URL`        | URL PostgreSQL (Prisma Dev en local, Neon poolée en prod) |
| `AUTH_SECRET`         | Secret de signature des sessions (`npx auth secret`)      |
| `ADMIN_EMAIL`         | Email du compte administrateur                            |
| `ADMIN_PASSWORD_HASH` | Hash **Argon2id** du mot de passe admin (jamais en clair) |
| `NEXT_PUBLIC_APP_URL` | URL publique du site                                      |
| `ASSETS_DIR`          | Dossier des assets (défaut : `Maps`)                      |

`.env` est ignoré par Git — seules ces variables documentées dans
`.env.example` sont attendues.

---

## Comptes et administrateurs

Les comptes vivent dans la table `User` (hash **Argon2id**, jamais de mot de
passe en clair). Créer le **premier** administrateur :

```bash
npm run admin:seed -- admin@exemple.com "MotDePasseSolide"
# ou, si ADMIN_EMAIL / ADMIN_PASSWORD_HASH sont dans l'environnement :
npm run admin:seed
```

Ensuite, tout se gère depuis **Administration → Utilisateurs** : création
de comptes (ex. l'accès de ton client), rôles (`ADMIN` / `USER`,
`MODERATOR` prévu), réinitialisation de mot de passe, désactivation,
suppression. Garde-fous intégrés : impossible de supprimer / rétrograder /
désactiver le **dernier administrateur actif** ou son **propre compte**.

### Comptes joueurs (grand public)

Les joueurs créent leur compte sur **`/signup`** (pseudo + email + mot de
passe, rôle `USER`) ou via **Google** (bouton visible seulement si
`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` sont renseignés — voir
`.env.example` pour la redirect URI). Premier login Google : compte créé
automatiquement ; si l'email existe déjà, le compte Google y est **lié**
(table `Account` — prête pour Discord/Steam). Chaque joueur édite son
profil sur **`/profile`** : nom d'affichage, avatar (portraits de
lancers de l'API fragpunk-assets), pays, bio.

## Importer des maps (Asset Manager)

**Administration → Assets** : créer une map (la structure de dossiers est
générée), puis glisser-déposer les plans (`1F.png`, `2F.png`, `B1`, `RDC`,
`Roof`… — l'étage est détecté par le nom) et les screenshots (1 ou 500
fichiers : copie, miniature WebP, entrée en base, progression et erreurs
par fichier, aucun écrasement). Bouton **« Commencer le placement »** →
l'atelier s'ouvre sur le premier screenshot non placé.

L'import s'effectue **en local** (l'hébergement Vercel est en lecture
seule — l'interface l'indique) ; déployer les assets = `git commit + push`.
L'ancienne méthode (déposer les dossiers à la main puis « Synchroniser »)
reste entièrement fonctionnelle : les deux alimentent la même structure.

---

## Déploiement sur Vercel

1. **Pousser le dépôt sur GitHub** (les assets `Maps/` sont versionnés et
   embarqués dans le déploiement).

2. **Créer la base Neon** : dans Vercel → _Storage_ → _Neon Postgres_
   (ou [neon.tech](https://neon.tech) directement). Récupérer l'URL de
   connexion **poolée** (`...-pooler...neon.tech`).

3. **Importer le projet dans Vercel** (framework Next.js détecté
   automatiquement ; le script `vercel-build` applique les migrations à
   chaque déploiement).

4. **Renseigner les variables d'environnement** (Settings → Environment
   Variables) : `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH`, `NEXT_PUBLIC_APP_URL` (l'URL Vercel du projet).

5. **Déployer**, puis sur le site en ligne : `/login` → `/admin` →
   **Synchroniser les assets** → placer les screenshots.

6. Envoyer l'URL au client 🎯 — `/` et `/play` sont publics, `/admin` et
   `/api/admin/*` exigent le rôle ADMIN.

**Ajouter une map en production** : déposer le dossier dans `Maps/`
(convention ci-dessous), commit + push → redéploiement → « Synchroniser »
dans l'admin.

---

## Sécurité

- `/admin` et `/api/admin/*` sont protégés par le **middleware** (Edge) :
  non authentifié → redirection `/login` (ou 401 JSON pour l'API) ;
  authentifié non-ADMIN → page 403 (ou 403 JSON). Défense en profondeur
  supplémentaire dans la page admin elle-même.
- Sessions **JWT signées** (`AUTH_SECRET`) dans des cookies **httpOnly,
  Secure, SameSite=Lax** — durée 12 h.
- Mot de passe admin : **hash Argon2id** uniquement, jamais stocké ni loggé
  en clair ; message d'erreur de connexion volontairement générique.
- Le gameplay ne révèle jamais la réponse : l'image d'une manche est servie
  par l'id de manche, le verdict est calculé côté serveur.

---

## Scripts

| Script                                  | Rôle                                    |
| --------------------------------------- | --------------------------------------- |
| `npm run dev`                           | serveur de dev (Turbopack)              |
| `npm run build`                         | build de production                     |
| `npm run vercel-build`                  | migrations + build (utilisé par Vercel) |
| `npm run db:dev`                        | Postgres local (Prisma Dev, détaché)    |
| `npm run db:migrate`                    | migration Prisma (dev)                  |
| `npm run db:studio`                     | explorateur de base                     |
| `npm run admin:hash`                    | hash Argon2 d'un mot de passe admin     |
| `npm run lint` / `format` / `typecheck` | qualité                                 |

Hook pre-commit (Husky + lint-staged) : lint + format des fichiers stagés.

---

## Architecture

```
app/                  # routes App Router (fines, composent les features)
components/           # UI partagée : shadcn (ui/), layout/, motion/, providers/
features/
├── game/             # gameplay (sessions, manches, guess) — piloté serveur
├── admin/            # atelier de placement des screenshots (rôle ADMIN)
├── auth/             # Auth.js v5 : config edge-safe + Credentials/Argon2
└── stats|profile|achievements|leaderboard/   # à venir (README de périmètre)
hooks/ lib/ store/ types/   # infra transverse (pan-zoom, prisma, env, zod)
prisma/               # schéma + migrations PostgreSQL
Maps/                 # assets du jeu (versionnés, embarqués au déploiement)
middleware.ts         # protection /admin + /api/admin
```

**Assets** — convention par map, synchronisée depuis l'admin :

```
Maps/<NomDeLaMap>/
├── floors/       1F.png, 2F.png, B1.png…   (plans PNG/WebP)
└── screenshots/  0001.webp, 0002.png…
```

**Règles de dépendance** : une feature importe `components/`, `lib/`,
`types/`, `hooks/` — jamais une autre feature. Chaque feature expose son API
publique via son `index.ts`.

---

## Design System & i18n

- **[`DESIGN.md`](DESIGN.md)** documente l'identité « Ink & Signal » :
  palette, typographies, grille, notches, ombres, textures, motion, icônes
  et inventaire des composants — suffisant pour construire tout écran.
- **Illustrations sans toucher au code** : éditer
  `public/branding/branding.json` (slots `home.hero`, `play.start`…) avec
  des URLs d'images, par ex. celles de
  [fragpunk-assets](https://github.com/RyusAceVA/fragpunk-assets).
- **i18n** : aucun texte en dur dans les composants — tout vient de
  `messages/<locale>.json` (namespaces + pluriels ICU). Ajouter une langue =
  créer `messages/de.json` + ajouter le code dans `i18n/config.ts`.
  Les noms de maps, d'étages et les assets ne sont **jamais** traduits.
