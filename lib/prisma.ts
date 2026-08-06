import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/lib/env";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Singleton PrismaClient — évite d'épuiser les connexions avec le
 * hot-reload de Next.js en dev.
 *
 * PostgreSQL partout : Neon en production (URL poolée), Neon ou
 * `npx prisma dev` (Postgres local) en développement.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
