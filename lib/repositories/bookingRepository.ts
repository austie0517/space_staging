import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Relations needed to render a booking card (space cover + guest name).
const bookingInclude = {
  space: { include: { images: true } },
  guest: {
    include: {
      user: { include: { kycSubmissions: true } },
      bookings: true,
      reviews: true,
    },
  },
} satisfies Prisma.BookingInclude;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

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
export async function getAllBookings() {
  return prisma.booking.findMany({
    include: bookingInclude,
    orderBy: { startAt: "desc" },
  });
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
    include: bookingInclude,
    orderBy: { startAt: "desc" },
  });
}

/** Bookings for a single space (newest first). */
export async function getBookingsBySpace(spaceId: string) {
  return prisma.booking.findMany({
    where: { spaceId },
    include: bookingInclude,
    orderBy: { startAt: "desc" },
  });
}

/** Bookings that block a resource calendar, including parent/child conflicts. */
export async function getBookingsForResourceCalendar(spaceId: string) {
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
      select id::text
      from public.bookings
      where space_id in (select id from conflict_resources)`,
    spaceId,
  );
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return [];
  return prisma.booking.findMany({
    where: { id: { in: ids } },
    include: bookingInclude,
    orderBy: { startAt: "desc" },
  });
}

/** Bookings across all spaces owned by a host (newest first). */
export async function getBookingsByHost(hostId: string) {
  return prisma.booking.findMany({
    where: { space: { hostId } },
    include: bookingInclude,
    orderBy: { startAt: "desc" },
  });
}
