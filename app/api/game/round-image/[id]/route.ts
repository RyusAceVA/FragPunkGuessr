import { getRoundImagePath } from "@/features/game/server/sessions";
import { serveAssetFile } from "@/lib/server/assets";

/**
 * Sert l'image d'une manche par l'id du Round : l'URL ne révèle ni la
 * map, ni le fichier, ni même l'identifiant du screenshot.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const assetPath = await getRoundImagePath(id);
  if (!assetPath) {
    return Response.json({ error: "Manche introuvable" }, { status: 404 });
  }
  return serveAssetFile(assetPath);
}
