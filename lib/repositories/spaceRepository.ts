import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { optimizeImageUrl } from "@/lib/imageUrl";
import type { Review, Space, SpaceField } from "@/types";

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
  reviews: {
    include: {
      guest: {
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
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

type PublishedSpaceFeedRow = {
  id: string;
  title: string;
  prefecture: string | null;
  city: string | null;
  town: string | null;
  description: string | null;
  pitchTitle: string | null;
  pitchBody: string | null;
  resourceCategory: string;
  capacityUnit: string;
  minBookingHours: number;
  capacity: number | null;
  spaceType: string;
  status: string;
  pricePerHour: number | null;
  reviewCount: number;
  rating: number | null;
  amenities: string[] | null;
  coverImageUrl: string | null;
};

const FEED_PLACEHOLDER =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";
const DETAIL_AVATAR_PLACEHOLDER =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

export async function getPublishedSpaceFeed(params?: {
  skip?: number;
  take?: number;
}): Promise<Space[]> {
  const rows = await prisma.$queryRawUnsafe<PublishedSpaceFeedRow[]>(
    `
      select
        s.id::text as "id",
        s.name as "title",
        s.prefecture,
        s.city,
        s.town,
        s.description,
        s.pitch_title as "pitchTitle",
        s.pitch_body as "pitchBody",
        s.resource_category as "resourceCategory",
        s.capacity_unit as "capacityUnit",
        s.min_booking_hours as "minBookingHours",
        s.capacity,
        s.space_type as "spaceType",
        s.status,
        (
          select so.price
          from public.space_options so
          where so.space_id = s.id
            and so.is_active is distinct from false
          order by
            case when so.price_type = 'hourly' then 0 else 1 end,
            so.created_at asc
          limit 1
        ) as "pricePerHour",
        (
          select count(*)::int
          from public.reviews r
          where r.space_id = s.id
        ) as "reviewCount",
        (
          select avg(r.rating)::float
          from public.reviews r
          where r.space_id = s.id
        ) as "rating",
        (
          select array_agg(t.name order by t.name)
          from public.space_tag_relations str
          join public.space_tags t
            on t.id = str.tag_id
          where str.space_id = s.id
        ) as "amenities",
        (
          select si.image_url
          from public.space_images si
          where si.space_id = s.id
          order by
            case when si.is_cover is true then 0 else 1 end,
            coalesce(si.sort_order, 0) asc,
            si.created_at asc
          limit 1
        ) as "coverImageUrl"
      from public.spaces s
      where s.status in ('approved', 'published')
      order by s.created_at desc
      offset $1
      limit $2
    `,
    params?.skip ?? 0,
    params?.take ?? 12,
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    area:
      [row.prefecture, row.city, row.town].filter(Boolean).join("") || "場所未設定",
    description: row.description ?? "",
    pitchTitle: row.pitchTitle ?? "",
    pitchBody: row.pitchBody ?? "",
    resourceCategory: row.resourceCategory,
    capacityUnit: row.capacityUnit,
    pricePerHour: row.pricePerHour ?? 0,
    minBookingHours: row.minBookingHours ?? 1,
    capacity: row.capacity ?? 1,
    rating: row.rating ? Math.round(row.rating * 10) / 10 : 0,
    reviewCount: row.reviewCount ?? 0,
    spaceType: row.spaceType,
    images: [
      optimizeImageUrl(row.coverImageUrl || FEED_PLACEHOLDER, {
        width: 1200,
        quality: 58,
      }),
    ],
    amenities: row.amenities ?? [],
    wifi: true,
    parking: false,
    published: row.status === "published" || row.status === "approved",
  }));
}

/** All spaces owned by a host (host dashboard / management). */
export async function getHostSpaces(hostId: string) {
  return prisma.space.findMany({
    where: { hostId },
    select: spaceCardSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getHostSpaceFeed(hostId: string): Promise<Space[]> {
  const rows = await prisma.$queryRawUnsafe<PublishedSpaceFeedRow[]>(
    `
      select
        s.id::text as "id",
        s.name as "title",
        s.prefecture,
        s.city,
        s.town,
        s.description,
        s.pitch_title as "pitchTitle",
        s.pitch_body as "pitchBody",
        s.resource_category as "resourceCategory",
        s.capacity_unit as "capacityUnit",
        s.min_booking_hours as "minBookingHours",
        s.capacity,
        s.space_type as "spaceType",
        s.status,
        (
          select so.price
          from public.space_options so
          where so.space_id = s.id
            and so.is_active is distinct from false
          order by
            case when so.price_type = 'hourly' then 0 else 1 end,
            so.created_at asc
          limit 1
        ) as "pricePerHour",
        (
          select count(*)::int
          from public.reviews r
          where r.space_id = s.id
        ) as "reviewCount",
        (
          select avg(r.rating)::float
          from public.reviews r
          where r.space_id = s.id
        ) as "rating",
        (
          select array_agg(t.name order by t.name)
          from public.space_tag_relations str
          join public.space_tags t
            on t.id = str.tag_id
          where str.space_id = s.id
        ) as "amenities",
        (
          select si.image_url
          from public.space_images si
          where si.space_id = s.id
          order by
            case when si.is_cover is true then 0 else 1 end,
            coalesce(si.sort_order, 0) asc,
            si.created_at asc
          limit 1
        ) as "coverImageUrl"
      from public.spaces s
      where s.host_id = $1::uuid
      order by s.created_at desc
    `,
    hostId,
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    area:
      [row.prefecture, row.city, row.town].filter(Boolean).join("") || "場所未設定",
    description: row.description ?? "",
    pitchTitle: row.pitchTitle ?? "",
    pitchBody: row.pitchBody ?? "",
    resourceCategory: row.resourceCategory,
    capacityUnit: row.capacityUnit,
    pricePerHour: row.pricePerHour ?? 0,
    minBookingHours: row.minBookingHours ?? 1,
    capacity: row.capacity ?? 1,
    rating: row.rating ? Math.round(row.rating * 10) / 10 : 0,
    reviewCount: row.reviewCount ?? 0,
    spaceType: row.spaceType,
    images: [
      optimizeImageUrl(row.coverImageUrl || FEED_PLACEHOLDER, {
        width: 1200,
        quality: 58,
      }),
    ],
    amenities: row.amenities ?? [],
    wifi: true,
    parking: false,
    published: row.status === "published" || row.status === "approved",
  }));
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

type SpaceDetailMainRow = {
  id: string;
  parentSpaceId: string | null;
  title: string;
  prefecture: string | null;
  city: string | null;
  town: string | null;
  description: string | null;
  pitchTitle: string | null;
  pitchBody: string | null;
  resourceCategory: string;
  capacityUnit: string;
  pricePerHour: number | null;
  minBookingHours: number;
  capacity: number | null;
  rating: number | null;
  reviewCount: number;
  spaceType: string;
  images: string[] | null;
  amenities: string[] | null;
  status: string;
};

type SpaceDetailReviewRow = {
  id: string;
  spaceId: string;
  bookingId: string | null;
  authorName: string;
  rating: number;
  body: string | null;
  createdAtYear: number;
  createdAtMonth: number;
};

type SpaceDetailFieldRow = {
  id: string;
  spaceId: string;
  key: string;
  label: string;
  value: string | null;
  isPublic: boolean;
  order: number;
  type: string;
  options: unknown;
};

export async function getSpaceDetailPageData(id: string): Promise<{
  parentSpaceId: string | null;
  space: Space | null;
  reviews: Review[];
  fields: SpaceField[];
}> {
  const [mainRows, reviewRows, fieldRows] = await Promise.all([
    prisma.$queryRawUnsafe<SpaceDetailMainRow[]>(
      `
        select
          s.id::text as "id",
          s.parent_space_id::text as "parentSpaceId",
          s.name as "title",
          s.prefecture,
          s.city,
          s.town,
          s.description,
          s.pitch_title as "pitchTitle",
          s.pitch_body as "pitchBody",
          s.resource_category as "resourceCategory",
          s.capacity_unit as "capacityUnit",
          s.min_booking_hours as "minBookingHours",
          s.capacity,
          s.space_type as "spaceType",
          s.status,
          (
            select so.price
            from public.space_options so
            where so.space_id = s.id
              and so.is_active is distinct from false
            order by
              case when so.price_type = 'hourly' then 0 else 1 end,
              so.created_at asc
            limit 1
          ) as "pricePerHour",
          (
            select avg(r.rating)::float
            from public.reviews r
            where r.space_id = s.id
          ) as "rating",
          (
            select count(*)::int
            from public.reviews r
            where r.space_id = s.id
          ) as "reviewCount",
          (
            select array_agg(si.image_url order by
              case when si.is_cover is true then 0 else 1 end,
              coalesce(si.sort_order, 0) asc,
              si.created_at asc
            )
            from public.space_images si
            where si.space_id = s.id
          ) as "images",
          (
            select array_agg(t.name order by t.name)
            from public.space_tag_relations str
            join public.space_tags t
              on t.id = str.tag_id
            where str.space_id = s.id
          ) as "amenities"
        from public.spaces s
        where s.id = $1::uuid
        limit 1
      `,
      id,
    ),
    prisma.$queryRawUnsafe<SpaceDetailReviewRow[]>(
      `
        select
          r.id::text as "id",
          r.space_id::text as "spaceId",
          r.booking_id::text as "bookingId",
          u.name as "authorName",
          r.rating,
          r.comment as "body",
          extract(year from r.created_at)::int as "createdAtYear",
          extract(month from r.created_at)::int as "createdAtMonth"
        from public.reviews r
        join public.guests g
          on g.id = r.guest_id
        join public.users u
          on u.id = g.user_id
        where r.space_id = $1::uuid
        order by r.created_at desc
      `,
      id,
    ),
    prisma.$queryRawUnsafe<SpaceDetailFieldRow[]>(
      `
        select
          sf.id::text as "id",
          sf.space_id::text as "spaceId",
          sf.field_key as "key",
          sf.field_label as "label",
          sf.field_value as "value",
          sf.is_public as "isPublic",
          sf.display_order as "order",
          sf.field_type as "type",
          sf.options
        from public.space_fields sf
        where sf.space_id = $1::uuid
          and sf.is_public is true
        order by sf.display_order asc
      `,
      id,
    ),
  ]);

  const main = mainRows[0];
  if (!main) {
    return {
      parentSpaceId: null,
      space: null,
      reviews: [],
      fields: [],
    };
  }

  return {
    parentSpaceId: main.parentSpaceId,
    space: {
      id: main.id,
      title: main.title,
      area:
        [main.prefecture, main.city, main.town].filter(Boolean).join("") ||
        "場所未設定",
      description: main.description ?? "",
      pitchTitle: main.pitchTitle ?? "",
      pitchBody: main.pitchBody ?? "",
      resourceCategory: main.resourceCategory,
      capacityUnit: main.capacityUnit,
      pricePerHour: main.pricePerHour ?? 0,
      minBookingHours: main.minBookingHours ?? 1,
      capacity: main.capacity ?? 1,
      rating: main.rating ? Math.round(main.rating * 10) / 10 : 0,
      reviewCount: main.reviewCount ?? 0,
      spaceType: main.spaceType,
      images:
        main.images?.length
          ? main.images.map((imageUrl) =>
              optimizeImageUrl(imageUrl, { width: 1200, quality: 58 }),
            )
          : [FEED_PLACEHOLDER],
      amenities: main.amenities ?? [],
      wifi: true,
      parking: false,
      published: main.status === "published" || main.status === "approved",
    },
    reviews: reviewRows.map((row) => ({
      id: row.id,
      spaceId: row.spaceId,
      bookingId: row.bookingId ?? undefined,
      authorName: row.authorName,
      authorAvatar: DETAIL_AVATAR_PLACEHOLDER,
      rating: row.rating,
      body: row.body ?? "",
      createdAt: `${row.createdAtYear}年${row.createdAtMonth}月`,
    })),
    fields: fieldRows.map((row) => ({
      id: row.id,
      spaceId: row.spaceId,
      key: row.key,
      label: row.label,
      value: row.value ?? "",
      isPublic: row.isPublic,
      order: row.order,
      type: row.type as SpaceField["type"],
      options: Array.isArray(row.options)
        ? (row.options as unknown[]).map(String)
        : undefined,
    })),
  };
}
