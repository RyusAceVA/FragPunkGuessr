/**
 * Crée (ou répare) un administrateur EN BASE.
 *
 * Deux modes :
 *   npm run admin:seed
 *     → réutilise ADMIN_EMAIL + ADMIN_PASSWORD_HASH de l'environnement
 *       (le mot de passe actuel continue de fonctionner tel quel)
 *
 *   npm run admin:seed -- email@exemple.com "MotDePasseSolide" [username]
 *     → crée un admin avec ces identifiants (hash Argon2id généré)
 *
 * Idempotent : si l'email existe déjà, le compte est promu ADMIN,
 * réactivé et son mot de passe mis à jour.
 */
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL manquante — lancer via : npm run admin:seed (lit .env)",
  );
  process.exit(1);
}

/** Les .env Next échappent les $ en \$ — on restaure la valeur brute. */
const unescape = (value) => value?.replaceAll("\\$", "$");

const [, , argEmail, argPassword, argUsername] = process.argv;

let email;
let passwordHash;
if (argEmail && argPassword) {
  if (argPassword.length < 8) {
    console.error("Le mot de passe doit faire au moins 8 caractères.");
    process.exit(1);
  }
  email = argEmail;
  passwordHash = await argon2.hash(argPassword, { type: argon2.argon2id });
} else {
  email = process.env.ADMIN_EMAIL;
  passwordHash = unescape(process.env.ADMIN_PASSWORD_HASH);
  if (!email || !passwordHash?.startsWith("$argon2")) {
    console.error(
      "ADMIN_EMAIL / ADMIN_PASSWORD_HASH absents de l'environnement.\n" +
        'Utilisation directe : npm run admin:seed -- email "MotDePasse" [username]',
    );
    process.exit(1);
  }
}

email = email.trim().toLowerCase();
const username = (argUsername ?? email.split("@")[0]).trim();

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const { rows } = await client.query(
    `INSERT INTO "User" (id, email, username, "passwordHash", role, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'ADMIN', true, now(), now())
     ON CONFLICT (email) DO UPDATE
       SET "passwordHash" = EXCLUDED."passwordHash",
           role = 'ADMIN',
           "isActive" = true,
           "updatedAt" = now()
     RETURNING id, email, username`,
    [randomUUID(), email, username, passwordHash],
  );
  console.log(
    `✔ Administrateur prêt : ${rows[0].email} (username : ${rows[0].username})`,
  );
} finally {
  await client.end();
}
