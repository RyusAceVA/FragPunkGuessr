import { auth } from "@/features/auth";
import { updateProfileSchema } from "@/features/profile/schemas";
import type { ProfileData } from "@/features/profile/types";
import { prisma } from "@/lib/prisma";

function serializeProfile(user: {
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  bio: string | null;
  createdAt: Date;
}): ProfileData {
  return {
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    country: user.country,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Profil de l'utilisateur connecté. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }
  return Response.json(serializeProfile(user));
}

/** Mise à jour du profil (displayName, avatar, country, bio). */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName: parsed.data.displayName,
      country: parsed.data.country,
      bio: parsed.data.bio,
      ...(parsed.data.avatarUrl !== undefined
        ? { avatarUrl: parsed.data.avatarUrl }
        : {}),
    },
  });
  return Response.json(serializeProfile(user));
}
