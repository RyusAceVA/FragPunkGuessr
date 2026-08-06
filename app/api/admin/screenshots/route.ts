import { listScreenshots } from "@/features/admin/server/screenshots";

export async function GET(request: Request) {
  const mapId = new URL(request.url).searchParams.get("mapId");
  if (!mapId) {
    return Response.json({ error: "Paramètre mapId requis" }, { status: 400 });
  }
  const screenshots = await listScreenshots(mapId);
  return Response.json(screenshots);
}
