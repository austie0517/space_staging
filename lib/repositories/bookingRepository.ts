import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Lightweight selection for booking lists/cards.
const bookingSelect = {
  id: true,
  spaceId: true,
  guestId: true,
  bookingLevel: true,
  quantity: true,
  startAt: true,
  endAt: true,
  totalPrice: true,
  platformFee: true,
  status: true,
  discountNote: true,
  space: {
    select: {
      name: true,
      images: {
        select: { imageUrl: true, isCover: true, sortOrder: true },
      },
    },
  },
  guest: {
    select: {
      createdAt: true,
      profession: true,
      license: true,
      user: {
        select: {
          name: true,
          avatarUrl: true,
          kycSubmissions: {
            select: { status: true },
          },
        },
      },
      bookings: {
        select: { status: true },
      },
      reviews: {
        select: { rating: true },
      },
    },
  },
} satisfies Prisma.BookingSelect;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  select: typeof bookingSelect;
}>;

const hostBookingListSelect = {
  id: true,
  spaceId: true,
  guestId: true,
  bookingLevel: true,
  quantity: true,
  startAt: true,
  endAt: true,
  totalPrice: true,
  platformFee: true,
  status: true,
  discountNote: true,
  space: {
    select: {
      name: true,
      images: {
        select: { imageUrl: true, isCover: true, sortOrder: true },
      },
    },
  },
  guest: {
    select: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
  },
} satisfies Prisma.BookingSelect;

export type HostBookingListRow = Prisma.BookingGetPayload<{
  select: typeof hostBookingListSelect;
}>;

const bookingCalendarSelect = {
  id: true,
  startAt: true,
  endAt: true,
  status: true,
  guest: {
    select: {
      user: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BookingSelect;

export type CalendarBookingRow = Prisma.BookingGetPayload<{
  select: typeof bookingCalendarSelect;
}>;

type CalendarBookingQueryRow = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  guestName: string | null;
};

const guestBookingListSelect = {
  id: true,
  spaceId: true,
  guestId: true,
  bookingLevel: true,
  quantity: true,
  startAt: true,
  endAt: true,
  totalPrice: true,
  platformFee: true,
  status: true,
  discountNote: true,
  space: {
    select: {
      name: true,
      images: {
        select: { imageUrl: true, isCover: true, sortOrder: true },
      },
    },
  },
} satisfies Prisma.BookingSelect;

export type GuestBookingListRow = Prisma.BookingGetPayload<{
  select: typeof guestBookingListSelect;
}>;

export type PendingHostBookingRow = {
  id: string;
  spaceId: string;
  guestId: string;
  bookingLevel: string | null;
  quantity: number | null;
  startAt: Date;
  endAt: Date;
  totalPrice: number;
  platformFee: number;
  status: string;
  discountNote: string | null;
  spaceTitle: string;
  guestName: string;
  guestAvatar: string | null;
  guestProfession: string | null;
  guestLicense: string | null;
  guestVerified: boolean;
  guestJoinedAt: Date;
  guestUsageCount: number;
  guestRating: number | null;
  guestReviewCount: number;
};

export type HostSpaceBookingListRow = {
  id: string;
  spaceId: string;
  guestId: string;
  bookingLevel: string | null;
  quantity: number | null;
  startAt: Date;
  endAt: Date;
  totalPrice: number;
  platformFee: number;
  status: string;
  discountNote: string | null;
  spaceTitle: string;
  guestName: string;
  guestAvatar: string | null;
};

/** Create a booking. Caller supplies spaceId/guestId and the priced amounts. */
export async function createBooking(data: Prisma.BookingUncheckedCreateInput) {
  return prisma.booking.create({ data });
}

/**
 * Is there an active (not cancelled/rejected) booking on this space whose time
 * range overlaps [startAt, endAt)? Used to block double-booking.
 */
export async function hasOverlappingBooking(
  spaceId: string,
  startAt: Date,
  endAt: Date,
) {
  const count = await prisma.booking.count({
    where: {
      spaceId,
      status: { notIn: ["cancelled", "rejected"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  return count > 0;
}

/**
 * Checks the resource tree, not just the selected row:
 * - parent-space booking conflicts with every direct child
 * - child-seat booking conflicts with itself and its parent
 */
export async function hasOverlappingResourceBooking(
  spaceId: string,
  startAt: Date,
  endAt: Date,
) {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `with selected as (
        select id, parent_space_id
        from public.spaces
        where id = $1::uuid
      ),
      conflict_resources as (
        select id from selected
        union
        select parent_space_id
        from selected
        where parent_space_id is not null
        union
        select child.id
        from public.spaces child
        join selected parent
          on child.parent_space_id = parent.id
        where parent.parent_space_id is null
      )
      select b.id::text as id
      from public.bookings b
      where b.space_id in (select id from conflict_resources)
        and b.status not in ('cancelled', 'rejected')
        and b.start_at < $3
        and b.end_at > $2
      limit 1`,
    spaceId,
    startAt,
    endAt,
  );
  return rows.length > 0;
}

/** Update a booking's status (pending | approved | rejected | cancelled | completed). */
export async function updateBookingStatus(id: string, status: string) {
  return prisma.booking.update({ where: { id }, data: { status } });
}

/** All bookings across the platform (admin). */
export async function getAllBookings(params?: { skip?: number; take?: number }) {
  return prisma.booking.findMany({
    select: bookingSelect,
    orderBy: { startAt: "desc" },
    skip: params?.skip,
    take: params?.take,
  });
}

export async function countAllBookings() {
  return prisma.booking.count();
}

/** Cancel a booking and mark its payments refunded (admin refund). */
export async function refundBooking(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!booking) return;
  await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { status: "cancelled" } }),
    ...booking.payments.map((p) =>
      prisma.payment.update({
        where: { id: p.id },
        data: { status: "refunded", refundedAmount: p.amount },
      }),
    ),
  ]);
}

/** Bookings made by a guest (newest first). */
export async function getBookingsByGuest(guestId: string) {
  return prisma.booking.findMany({
    where: { guestId },
    select: bookingSelect,
    orderBy: { startAt: "desc" },
  });
}

export async function getGuestBookingList(guestId: string) {
  return prisma.booking.findMany({
    where: { guestId },
    select: guestBookingListSelect,
    orderBy: { startAt: "desc" },
  });
}

/** Bookings for a single space (newest first). */
export async function getBookingsBySpace(spaceId: string) {
  return prisma.booking.findMany({
    where: { spaceId },
    select: bookingSelect,
    orderBy: { startAt: "desc" },
  });
}

/** Bookings that block a resource calendar, including parent/child conflicts. */
export async function getBookingsForResourceCalendar(spaceId: string) {
  const rows = await prisma.$queryRawUnsafe<CalendarBookingQueryRow[]>(
    `with selected as (
        select id, parent_space_id
        from public.spaces
        where id = $1::uuid
      ),
      conflict_resources as (
        select id from selected
        union
        select parent_space_id
        from selected
        where parent_space_id is not null
        union
        select child.id
        from public.spaces child
        join selected parent
          on child.parent_space_id = parent.id
        where parent.parent_space_id is null
      )
      select
        b.id::text as "id",
        b.start_at as "startAt",
        b.end_at as "endAt",
        b.status as "status",
        u.name as "guestName"
      from public.bookings b
      left join public.guests g on g.id = b.guest_id
      left join public.users u on u.id = g.user_id
      where b.space_id in (select id from conflict_resources)
        and b.status not in ('cancelled', 'rejected')
      order by b.start_at desc`,
    spaceId,
  );
  return rows.map((row) => ({
    id: row.id,
    startAt: row.startAt,
    endAt: row.endAt,
    status: row.status,
    guest: {
      user: {
        name: row.guestName ?? "",
      },
    },
  }));
}

/** Bookings across all spaces owned by a host (newest first). */
export async function getBookingsByHost(hostId: string) {
  return prisma.booking.findMany({
    where: { space: { hostId } },
    select: bookingSelect,
    orderBy: { startAt: "desc" },
  });
}

/** Pending bookings only, with full guest detail for the approval dialog. */
export async function getPendingBookingsByHost(hostId: string) {
  return prisma.$queryRawUnsafe<PendingHostBookingRow[]>(
    `
      select
        b.id::text as "id",
        b.space_id::text as "spaceId",
        b.guest_id::text as "guestId",
        b.booking_level as "bookingLevel",
        b.quantity as "quantity",
        b.start_at as "startAt",
        b.end_at as "endAt",
        b.total_price as "totalPrice",
        b.platform_fee as "platformFee",
        b.status as "status",
        b.discount_note as "discountNote",
        s.name as "spaceTitle",
        u.name as "guestName",
        u.avatar_url as "guestAvatar",
        g.profession as "guestProfession",
        g.license as "guestLicense",
        exists(
          select 1
          from public.kyc_submissions ks
          where ks.user_id = u.id
            and ks.status = 'approved'
        ) as "guestVerified",
        g.created_at as "guestJoinedAt",
        (
          select count(*)::int
          from public.bookings gb
          where gb.guest_id = g.id
            and gb.status not in ('cancelled', 'rejected')
        ) as "guestUsageCount",
        (
          select avg(rv.rating)::float
          from public.reviews rv
          where rv.guest_id = g.id
        ) as "guestRating",
        (
          select count(*)::int
          from public.reviews rv
          where rv.guest_id = g.id
        ) as "guestReviewCount"
      from public.bookings b
      join public.spaces s on s.id = b.space_id
      join public.guests g on g.id = b.guest_id
      join public.users u on u.id = g.user_id
      where s.host_id = $1::uuid
        and b.status = 'pending'
      order by b.start_at desc
    `,
    hostId,
  );
}

export async function getBookingsBySpaceForHost(spaceId: string) {
  return prisma.$queryRawUnsafe<PendingHostBookingRow[]>(
    `
      select
        b.id::text as "id",
        b.space_id::text as "spaceId",
        b.guest_id::text as "guestId",
        b.booking_level as "bookingLevel",
        b.quantity as "quantity",
        b.start_at as "startAt",
        b.end_at as "endAt",
        b.total_price as "totalPrice",
        b.platform_fee as "platformFee",
        b.status as "status",
        b.discount_note as "discountNote",
        s.name as "spaceTitle",
        u.name as "guestName",
        u.avatar_url as "guestAvatar",
        g.profession as "guestProfession",
        g.license as "guestLicense",
        exists(
          select 1
          from public.kyc_submissions ks
          where ks.user_id = u.id
            and ks.status = 'approved'
        ) as "guestVerified",
        g.created_at as "guestJoinedAt",
        (
          select count(*)::int
          from public.bookings gb
          where gb.guest_id = g.id
            and gb.status not in ('cancelled', 'rejected')
        ) as "guestUsageCount",
        (
          select avg(rv.rating)::float
          from public.reviews rv
          where rv.guest_id = g.id
        ) as "guestRating",
        (
          select count(*)::int
          from public.reviews rv
          where rv.guest_id = g.id
        ) as "guestReviewCount"
      from public.bookings b
      join public.spaces s on s.id = b.space_id
      join public.guests g on g.id = b.guest_id
      join public.users u on u.id = g.user_id
      where b.space_id = $1::uuid
        and b.status = 'pending'
      order by b.start_at desc
    `,
    spaceId,
  );
}

export async function getHostSpaceBookingList(spaceId: string) {
  return prisma.$queryRawUnsafe<HostSpaceBookingListRow[]>(
    `
      select
        b.id::text as "id",
        b.space_id::text as "spaceId",
        b.guest_id::text as "guestId",
        b.booking_level as "bookingLevel",
        b.quantity as "quantity",
        b.start_at as "startAt",
        b.end_at as "endAt",
        b.total_price as "totalPrice",
        b.platform_fee as "platformFee",
        b.status as "status",
        b.discount_note as "discountNote",
        s.name as "spaceTitle",
        u.name as "guestName",
        u.avatar_url as "guestAvatar"
      from public.bookings b
      join public.spaces s on s.id = b.space_id
      join public.guests g on g.id = b.guest_id
      join public.users u on u.id = g.user_id
      where b.space_id = $1::uuid
      order by b.start_at desc
    `,
    spaceId,
  );
}

/** Confirmed/past list rows for the host booking index. */
export async function getHostBookingList(hostId: string, params?: { take?: number }) {
  return prisma.booking.findMany({
    where: {
      space: { hostId },
      status: { in: ["approved", "completed"] },
    },
    select: hostBookingListSelect,
    orderBy: { startAt: "desc" },
    take: params?.take,
  });
}

/** Aggregated earnings by status for the host earnings page. */
export async function getHostBookingEarningsSummary(hostId: string) {
  return prisma.booking.groupBy({
    by: ["status"],
    where: {
      space: { hostId },
      status: { in: ["pending", "approved", "completed"] },
    },
    _sum: {
      totalPrice: true,
      platformFee: true,
    },
  });
}
