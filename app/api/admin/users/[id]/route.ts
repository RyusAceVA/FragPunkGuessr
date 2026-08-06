import { auth } from "@/features/auth";
import { updateUserSchema } from "@/features/admin/schemas";
import { AdminError } from "@/features/admin/server/screenshots";
import { deleteUser, updateUser } from "@/features/admin/server/users";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      { error: "Authentification requise" },
      { status: 401 },
    );
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  try {
    const user = await updateUser(id, parsed.data, session.user.id);
    return Response.json(user);
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      { error: "Authentification requise" },
      { status: 401 },
    );
  }
  const { id } = await params;
  try {
    await deleteUser(id, session.user.id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
