import { createZoneSchema } from "@/features/admin/schemas";
import { AdminError } from "@/features/admin/server/screenshots";
import { createZone } from "@/features/admin/server/zones";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createZoneSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  try {
    const zone = await createZone(parsed.data.mapId, parsed.data.name);
    return Response.json(zone, { status: 201 });
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
