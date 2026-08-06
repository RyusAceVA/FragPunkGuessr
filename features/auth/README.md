# features/auth

Authentification et gestion de session (à venir).

Périmètre prévu :

- inscription / connexion (modèle `User` déjà en base : email, username, passwordHash, role)
- session côté serveur (Auth.js ou solution maison via cookies signés)
- garde d'accès pour `/admin` (role `ADMIN`)

Structure attendue :

```
auth/
├── components/   # formulaires login / register
├── actions/      # Server Actions (signIn, signOut, register)
├── schemas.ts    # schémas Zod des credentials
└── index.ts
```
