import { auth } from "@/features/auth";
import { createUserSchema } from "@/features/admin/schemas";
import { AdminError } from "@/features/admin/server/screenshots";
import { createUser, listUsers } from "@/features/admin/server/users";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const search = new URL(request.url).searchParams.get("search") ?? "";
  const users = await listUsers(search, session.user.id);
  return Response.json(users);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const user = await createUser(parsed.data, session.user.id);
    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
