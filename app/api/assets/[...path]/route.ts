import { serveAssetFile } from "@/lib/server/assets";

/**
 * Sert les fichiers du dossier d'assets (plans, screenshots).
 * Les fichiers vivent hors de public/ pour que le contenu du jeu
 * (potentiellement des milliers de screenshots) reste hors du bundle
 * et puisse être déplacé vers un stockage objet sans changer les URLs.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  return serveAssetFile(segments.map(decodeURIComponent).join("/"));
}
