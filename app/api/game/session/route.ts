import { auth } from "@/features/auth";
import { createSessionSchema } from "@/features/game/schemas";
import { createSession, GameError } from "@/features/game/server/sessions";

/**
 * Démarre une partie du mode demandé (corps JSON optionnel : mode +
 * options — défaut CLASSIC). Si un joueur est connecté, la partie lui
 * est rattachée (statistiques) ; sinon elle reste anonyme.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = createSessionSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const authSession = await auth();
    const session = await createSession(
      authSession?.user?.id ?? null,
      parsed.data,
    );
    return Response.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof GameError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
