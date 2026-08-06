import { createAssetsMapSchema } from "@/features/assets/schemas";
import { AssetsError, createAssetsMap } from "@/features/assets/server/maps";
import { isAssetsRootWritable } from "@/lib/server/assets";

export async function POST(request: Request) {
  if (!(await isAssetsRootWritable())) {
    return Response.json(
      {
        error:
          "Système de fichiers en lecture seule — crée la map en local puis commit + push",
      },
      { status: 409 },
    );
  }
  const body = await request.json().catch(() => null);
  const parsed = createAssetsMapSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  try {
    const map = await createAssetsMap(parsed.data.name, parsed.data.code);
    return Response.json(map, { status: 201 });
  } catch (error) {
    if (error instanceof AssetsError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
