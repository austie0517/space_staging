import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** A space's display fields, ordered. */
export async function getSpaceFields(spaceId: string) {
  return prisma.spaceField.findMany({
    where: { spaceId },
    orderBy: { displayOrder: "asc" },
  });
}

export async function createSpaceField(
  data: Prisma.SpaceFieldUncheckedCreateInput,
) {
  return prisma.spaceField.create({ data });
}

export async function updateSpaceField(
  id: string,
  data: Prisma.SpaceFieldUncheckedUpdateInput,
) {
  return prisma.spaceField.update({ where: { id }, data });
}

export async function deleteSpaceField(id: string) {
  return prisma.spaceField.delete({ where: { id } });
}

/** Swap displayOrder between two fields (for move up/down). */
export async function swapSpaceFieldOrder(aId: string, bId: string) {
  const [a, b] = await Promise.all([
    prisma.spaceField.findUnique({ where: { id: aId }, select: { displayOrder: true } }),
    prisma.spaceField.findUnique({ where: { id: bId }, select: { displayOrder: true } }),
  ]);
  if (!a || !b) return;
  await prisma.$transaction([
    prisma.spaceField.update({ where: { id: aId }, data: { displayOrder: b.displayOrder } }),
    prisma.spaceField.update({ where: { id: bId }, data: { displayOrder: a.displayOrder } }),
  ]);
}

/** Next display order for a new field on a space. */
export async function nextDisplayOrder(spaceId: string) {
  const last = await prisma.spaceField.findFirst({
    where: { spaceId },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  return (last?.displayOrder ?? 0) + 1;
}
