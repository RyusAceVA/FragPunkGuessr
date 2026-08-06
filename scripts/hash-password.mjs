/**
 * Génère le hash Argon2 d'un mot de passe administrateur.
 *
 * Usage :
 *   npm run admin:hash -- "MonMotDePasseSolide"
 *
 * Copier la sortie dans la variable d'environnement ADMIN_PASSWORD_HASH
 * (entre guillemets simples dans un fichier .env — le hash contient des $).
 */
import argon2 from "argon2";

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error(
    'Usage : npm run admin:hash -- "MotDePasse"  (8 caractères minimum)',
  );
  process.exit(1);
}

const hash = await argon2.hash(password, { type: argon2.argon2id });

console.log("\n— Interface Vercel (valeur brute) ————————————————————————\n");
console.log(hash);
console.log(
  "\n— Fichier .env local (les $ doivent être échappés en \\$) ————\n",
);
console.log(`ADMIN_PASSWORD_HASH="${hash.replaceAll("$", "\\$")}"\n`);
