import { syncAssets } from "@/features/admin/server/sync";

/** Synchronise la base avec le dossier d'assets (idempotent). */
export async function POST() {
  const summary = await syncAssets();
  return Response.json(summary);
}
