import { submitGuessSchema } from "@/features/game/schemas";
import { GameError, submitGuess } from "@/features/game/server/sessions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = submitGuessSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const response = await submitGuess(id, parsed.data);
    return Response.json(response);
  } catch (error) {
    if (error instanceof GameError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
