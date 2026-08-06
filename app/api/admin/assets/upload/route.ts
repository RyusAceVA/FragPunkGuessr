import { uploadKindSchema } from "@/features/assets/schemas";
import { AssetsError } from "@/features/assets/server/maps";
import {
  MAX_UPLOAD_BYTES,
  saveFloorPlan,
  saveScreenshot,
} from "@/features/assets/server/uploads";
import { isAssetsRootWritable } from "@/lib/server/assets";

/**
 * Reçoit UN fichier (formData: mapId, kind, file) — le client envoie un
 * fichier par requête pour une progression et des erreurs granulaires.
 */
export async function POST(request: Request) {
  if (!(await isAssetsRootWritable())) {
    return Response.json(
      {
        ok: false,
        error: "Read-only file system — import locally, then commit + push",
      },
      { status: 409 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const mapId = formData?.get("mapId");
  const kind = uploadKindSchema.safeParse(formData?.get("kind"));
  const file = formData?.get("file");

  if (typeof mapId !== "string" || !kind.success || !(file instanceof File)) {
    return Response.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return Response.json({ ok: false, error: "Empty file" }, { status: 422 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { ok: false, error: "File too large (25 MB max)" },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const result =
      kind.data === "floor"
        ? await saveFloorPlan(mapId, file.name, bytes)
        : await saveScreenshot(mapId, file.name, bytes);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof AssetsError) {
      return Response.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
