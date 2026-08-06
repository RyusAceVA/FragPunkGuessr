import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { AdminError } from "./screenshots";
import type { AdminTag } from "../types";

/** Tags triés par usage décroissant puis alphabétique (pour la saisie rapide). */
export async function listTags(): Promise<AdminTag[]> {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { screenshots: true } } },
  });
  return tags
    .map((t) => ({
      id: t.id,
      name: t.name,
      screenshotCount: t._count.screenshots,
    }))
    .sort(
      (a, b) =>
        b.screenshotCount - a.screenshotCount || a.name.localeCompare(b.name),
    );
}

export async function createTag(name: string): Promise<AdminTag> {
  const normalized = name.trim().toLowerCase();
  try {
    const tag = await prisma.tag.create({ data: { name: normalized } });
    return { id: tag.id, name: tag.name, screenshotCount: 0 };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AdminError(409, `Le tag « ${normalized} » existe déjà`);
    }
    throw error;
  }
}

/** Suppression : le tag est détaché de tous les screenshots. */
export async function deleteTag(id: string): Promise<void> {
  try {
    await prisma.tag.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AdminError(404, "Tag introuvable");
    }
    throw error;
  }
}
