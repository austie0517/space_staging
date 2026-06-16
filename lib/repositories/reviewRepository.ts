import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Insert a guest review for a space (optionally tied to a booking). */
export async function createReview(data: Prisma.ReviewUncheckedCreateInput) {
  return prisma.review.create({ data });
}

/** Booking ids the guest has already reviewed (to hide the review button). */
export async function getReviewedBookingIds(guestId: string) {
  const rows = await prisma.review.findMany({
    where: { guestId, bookingId: { not: null } },
    select: { bookingId: true },
  });
  return rows.map((r) => r.bookingId).filter((id): id is string => Boolean(id));
}
