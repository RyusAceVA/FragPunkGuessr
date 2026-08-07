import { auth } from "@/features/auth";
import { getHeatmap } from "@/features/stats/server/statistics";

/** Heatmap des erreurs d'un étage — données du joueur connecté uniquement. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ floorId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { floorId } = await params;
  const heatmap = await getHeatmap(session.user.id, floorId);
  if (!heatmap) {
    return Response.json({ error: "Floor not found" }, { status: 404 });
  }
  return Response.json(heatmap);
}
