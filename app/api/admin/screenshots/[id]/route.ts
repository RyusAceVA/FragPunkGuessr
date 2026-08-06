import {
  AdminError,
  updateScreenshot,
} from "@/features/admin/server/screenshots";
import { updateScreenshotSchema } from "@/features/admin/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateScreenshotSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Requête invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const screenshot = await updateScreenshot(id, parsed.data);
    return Response.json(screenshot);
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
