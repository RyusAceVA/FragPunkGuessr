import { createSession, GameError } from "@/features/game/server/sessions";

/** Démarre une partie : N manches tirées sans doublon, toutes maps. */
export async function POST() {
  try {
    const session = await createSession();
    return Response.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof GameError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
