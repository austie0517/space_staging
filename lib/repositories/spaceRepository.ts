import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Data access for spaces (Prisma → Supabase). Returns raw Prisma rows with the
 * relations the UI needs; mapping to the UI `Space` shape lives in
 * `@/lib/mappers/space`. Server-only — never import from a client component.
 */

// Lightweight selection for space cards / list pages.
const spaceCardSelect = {
  id: true,
  name: true,
  prefecture: true,
  city: true,
  town: true,
  description: true,
  pitchTitle: true,
  pitchBody: true,
  resourceCategory: true,
  capacityUnit: true,
  minBookingHours: true,
  capacity: true,
  spaceType: true,
  status: true,
  images: {
    select: { imageUrl: true, isCover: true, sortOrder: true },
  },
  options: {
    select: { priceType: true, price: true, isActive: true },
  },
  reviews: {
    select: { rating: true },
  },
  tagRelations: {
    select: { tag: { select: { name: true } } },
  },
} satisfies Prisma.SpaceSelect;

export type SpaceWithRelations = Prisma.SpaceGetPayload<{
  select: typeof spaceCardSelect;
}>;

// Detail page also needs review authors, public custom fields and availability.
const spaceDetailInclude = {
  host: true,
  images: true,
  options: true,
  tagRelations: { include: { tag: true } },
  availabilities: true,
  reviews: {
    include: { guest: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  },
  spaceFields: {
    where: { isPublic: true },
    orderBy: { displayOrder: "asc" },
  },
} satisfies Prisma.SpaceInclude;

export type SpaceDetail = Prisma.SpaceGetPayload<{
  include: typeof spaceDetailInclude;
}>;

/** All spaces (admin / internal listings). */
export async function getSpaces(params?: { skip?: number; take?: number }) {
  return prisma.space.findMany({
    select: spaceCardSelect,
    orderBy: { createdAt: "desc" },
    skip: params?.skip,
    take: params?.take,
  });
}

export async function countAllSpaces() {
  return prisma.space.count();
}

/** Only published spaces — the public /spaces feed. */
export async function getPublishedSpaces(params?: { skip?: number; take?: number }) {
  return prisma.space.findMany({
    where: { status: { in: ["approved", "published"] } },
    select: spaceCardSelect,
    orderBy: { createdAt: "desc" },
    skip: params?.skip,
    take: params?.take,
  });
}

export async function countPublishedSpaces() {
  return prisma.space.count({
    where: { status: { in: ["approved", "published"] } },
  });
}

/** All spaces owned by a host (host dashboard / management). */
export async function getHostSpaces(hostId: string) {
  return prisma.space.findMany({
    where: { hostId },
    select: spaceCardSelect,
    orderBy: { createdAt: "desc" },
  });
}

/** Create a space. */
export async function createSpace(data: Prisma.SpaceUncheckedCreateInput) {
  return prisma.space.create({ data });
}

/** Update a space's columns. */
export async function updateSpace(
  id: string,
  data: Prisma.SpaceUncheckedUpdateInput,
) {
  return prisma.space.update({ where: { id }, data });
}

/** Set minimum booking duration. Raw SQL keeps this safe during client regen. */
export async function updateSpaceMinBookingHours(id: string, hours: number) {
  return prisma.$executeRawUnsafe(
    "update public.spaces set min_booking_hours = $1 where id = $2::uuid",
    hours,
    id,
  );
}

/** Read minimum booking duration without depending on regenerated Prisma types. */
export async function getSpaceMinBookingHours(id: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ min_booking_hours: number }>>(
    "select min_booking_hours from public.spaces where id = $1::uuid",
    id,
  );
  return rows[0]?.min_booking_hours ?? 1;
}

export type SpaceResourceMeta = {
  id: string;
  resourceCategory: string;
  capacityUnit: string;
};

export async function getSpaceResourceMeta(id: string): Promise<SpaceResourceMeta> {
  const rows = await prisma.$queryRawUnsafe<SpaceResourceMeta[]>(
    `select
        id::text as "id",
        resource_category as "resourceCategory",
        capacity_unit as "capacityUnit"
      from public.spaces
      where id = $1::uuid`,
    id,
  );
  return (
    rows[0] ?? {
      id,
      resourceCategory: "venue",
      capacityUnit: "person",
    }
  );
}

export async function getSpaceResourceMetas(
  ids: string[],
): Promise<Map<string, SpaceResourceMeta>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.$queryRawUnsafe<SpaceResourceMeta[]>(
    `select
        id::text as "id",
        resource_category as "resourceCategory",
        capacity_unit as "capacityUnit"
      from public.spaces
      where id = any($1::uuid[])`,
    ids,
  );
  return new Map(rows.map((row) => [row.id, row]));
}

export async function updateSpaceResourceClassification(input: {
  id: string;
  resourceCategory: string;
  spaceType: string;
  capacityUnit: string;
}) {
  return prisma.$executeRawUnsafe(
    `update public.spaces
        set resource_category = $2,
            space_type = $3,
            capacity_unit = $4
      where id = $1::uuid`,
    input.id,
    input.resourceCategory,
    input.spaceType,
    input.capacityUnit,
  );
}

export async function replaceSpaceImages(spaceId: string, imageUrls: string[]) {
  const cleaned = imageUrls.map((url) => url.trim()).filter(Boolean).slice(0, 5);
  await prisma.$transaction([
    prisma.spaceImage.deleteMany({ where: { spaceId } }),
    ...(cleaned.length
      ? [
          prisma.spaceImage.createMany({
            data: cleaned.map((imageUrl, index) => ({
              spaceId,
              imageUrl,
              isCover: index === 0,
              sortOrder: index,
            })),
          }),
        ]
      : []),
  ]);
}

/** Delete a space (cascades images/options/availabilities/bookings via FK). */
export async function deleteSpace(id: string) {
  return prisma.space.delete({ where: { id } });
}

/** Set the space's hourly price (creates the hourly option if missing). */
export async function upsertHourlyPrice(spaceId: string, price: number) {
  const existing = await prisma.spaceOption.findFirst({
    where: { spaceId, priceType: "hourly" },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    return prisma.spaceOption.update({
      where: { id: existing.id },
      data: { price },
    });
  }
  return prisma.spaceOption.create({
    data: { spaceId, name: "基本料金", priceType: "hourly", price, isActive: true },
  });
}

/** Single space with the extra relations the detail page needs. */
export async function getSpace(id: string) {
  return prisma.space.findUnique({
    where: { id },
    include: spaceDetailInclude,
  });
}
