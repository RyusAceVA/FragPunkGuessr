# features/leaderboard

Classements (à venir).

Périmètre prévu :

- classement global et par map (agrégats sur `GameSession` / `UserStats`)
- périodes : all-time, mensuel, hebdomadaire
- pagination + mise en cache React Query

Note : pas de table dédiée pour l'instant — les classements sont des
agrégats. Si les volumes le justifient, une table matérialisée
`LeaderboardEntry` pourra être ajoutée au schéma Prisma.

Structure attendue :

```
leaderboard/
├── components/
├── queries.ts    # requêtes d'agrégation Prisma
└── index.ts
```
