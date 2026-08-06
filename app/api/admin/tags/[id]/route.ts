import { AdminError } from "@/features/admin/server/screenshots";
import { deleteTag } from "@/features/admin/server/tags";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await deleteTag(id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
