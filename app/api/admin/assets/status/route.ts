import { isAssetsRootWritable } from "@/lib/server/assets";

/** L'hébergement permet-il d'écrire dans le dossier d'assets ? */
export async function GET() {
  return Response.json({ writable: await isAssetsRootWritable() });
}
