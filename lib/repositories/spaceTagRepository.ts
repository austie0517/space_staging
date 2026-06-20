import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Full amenity catalog (templates), ordered by category then name. */
export const getAllTags = cache(async function getAllTags() {
  return prisma.spaceTag.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
});

/** Tag ids currently attached to a space. */
export async function getSpaceTagIds(spaceId: string) {
  const rows = await prisma.spaceTagRelation.findMany({
    where: { spaceId },
    select: { tagId: true },
  });
  return rows.map((r) => r.tagId);
}

/** Toggle a tag on a space; returns the new attached state. */
export async function toggleSpaceTag(spaceId: string, tagId: string) {
  const existing = await prisma.spaceTagRelation.findUnique({
    where: { spaceId_tagId: { spaceId, tagId } },
  });
  if (existing) {
    await prisma.spaceTagRelation.delete({
      where: { spaceId_tagId: { spaceId, tagId } },
    });
    return false;
  }
  await prisma.spaceTagRelation.create({ data: { spaceId, tagId } });
  return true;
}
