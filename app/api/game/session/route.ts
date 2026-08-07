import { auth } from "@/features/auth";
import { createSession, GameError } from "@/features/game/server/sessions";

/**
 * Démarre une partie : N manches tirées sans doublon, toutes maps.
 * Si un joueur est connecté, la partie lui est rattachée (statistiques) ;
 * sinon elle reste anonyme et n'alimente aucun profil.
 */
export async function POST() {
  try {
    const authSession = await auth();
    const session = await createSession(authSession?.user?.id ?? null);
    return Response.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof GameError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
