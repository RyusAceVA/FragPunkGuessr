import { listAdminMaps } from "@/features/admin/server/screenshots";

export async function GET() {
  const maps = await listAdminMaps();
  return Response.json(maps);
}
