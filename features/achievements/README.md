# features/achievements

Succès / achievements (à venir).

Périmètre prévu :

- catalogue de succès (`Achievement` : code stable + seuil générique)
- déblocage à la fin d'une partie (`UserAchievement`)
- affichage grille avec progression et animations de déblocage

Principe : chaque succès est identifié par un `code` stable
(ex. `FIRST_GAME`, `SHARPSHOOTER`) et sa logique de déblocage vit ici,
dans un registre typé `Record<AchievementCode, (stats) => boolean>`.

Structure attendue :

```
achievements/
├── components/
├── registry.ts   # logique de déblocage par code
└── index.ts
```
