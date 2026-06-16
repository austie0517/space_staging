import type { Review } from "@/types";
import type { Prisma } from "@prisma/client";

const AVATAR_PLACEHOLDER =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

type ReviewWithGuest = Prisma.ReviewGetPayload<{
  include: { guest: { include: { user: true } } };
}>;

/** Map a Prisma `Review` (+guest.user) to the UI `Review` shape. */
export function toUIReview(r: ReviewWithGuest): Review {
  const d = r.createdAt;
  return {
    id: r.id,
    spaceId: r.spaceId,
    bookingId: r.bookingId ?? undefined,
    authorName: r.guest.user.name,
    authorAvatar: AVATAR_PLACEHOLDER, // avatars not modeled in DB yet
    rating: r.rating,
    body: r.comment ?? "",
    createdAt: `${d.getFullYear()}年${d.getMonth() + 1}月`,
  };
}
