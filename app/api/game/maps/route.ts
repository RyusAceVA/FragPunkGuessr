import { listPlayableMaps } from "@/features/game/server/maps";

export async function GET() {
  const maps = await listPlayableMaps();
  return Response.json(maps);
}
