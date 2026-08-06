import { renameZoneSchema } from "@/features/admin/schemas";
import { AdminError } from "@/features/admin/server/screenshots";
import { deleteZone, renameZone } from "@/features/admin/server/zones";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = renameZoneSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  try {
    const zone = await renameZone(id, parsed.data.name);
    return Response.json(zone);
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await deleteZone(id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
