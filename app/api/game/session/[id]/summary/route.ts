import { GameError, getSessionSummary } from "@/features/game/server/sessions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const summary = await getSessionSummary(id);
    return Response.json(summary);
  } catch (error) {
    if (error instanceof GameError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
