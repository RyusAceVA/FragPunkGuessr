import { createTagSchema } from "@/features/admin/schemas";
import { AdminError } from "@/features/admin/server/screenshots";
import { createTag, listTags } from "@/features/admin/server/tags";

export async function GET() {
  const tags = await listTags();
  return Response.json(tags);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const tag = await createTag(parsed.data.name);
    return Response.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
