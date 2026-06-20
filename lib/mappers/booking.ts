import { optimizeImageUrl } from "@/lib/imageUrl";
import type { Booking, BookingStatus } from "@/types";
import type {
  BookingWithRelations,
  CalendarBookingRow,
  GuestBookingListRow,
  HostBookingListRow,
  PendingHostBookingRow,
} from "@/lib/repositories/bookingRepository";

const COVER_PLACEHOLDER =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";
const AVATAR_PLACEHOLDER =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80";

// DB statuses → the 4 UI statuses the screens understand.
const STATUS_MAP: Record<string, BookingStatus> = {
  pending: "pending",
  approved: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
  rejected: "cancelled",
};

function cover(images: { imageUrl: string; isCover: boolean | null; sortOrder: number | null }[]) {
  const sorted = [...images].sort(
    (a, b) =>
      Number(b.isCover) - Number(a.isCover) ||
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  return optimizeImageUrl(sorted[0]?.imageUrl || COVER_PLACEHOLDER, {
    width: 640,
    quality: 55,
  });
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:00`;
const pad2 = (n: number) => String(n).padStart(2, "0");
const joined = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月`;

export type CalendarBooking = {
  ymd: string; // local YYYY-MM-DD
  start: string;
  end: string;
  guestName: string;
  status: BookingStatus;
};

/** Lightweight booking shape for the per-space month calendar. */
export function toCalendarBooking(b: BookingWithRelations): CalendarBooking {
  return {
    ymd: `${b.startAt.getFullYear()}-${pad2(b.startAt.getMonth() + 1)}-${pad2(b.startAt.getDate())}`,
    start: hhmm(b.startAt),
    end: hhmm(b.endAt),
    guestName: b.guest.user.name,
    status: STATUS_MAP[b.status] ?? "pending",
  };
}

export function toCalendarBookingFromRow(b: CalendarBookingRow): CalendarBooking {
  return {
    ymd: `${b.startAt.getFullYear()}-${pad2(b.startAt.getMonth() + 1)}-${pad2(b.startAt.getDate())}`,
    start: hhmm(b.startAt),
    end: hhmm(b.endAt),
    guestName: b.guest.user.name,
    status: STATUS_MAP[b.status] ?? "pending",
  };
}

/** Map a Prisma `Booking` (+space.images, +guest.user) to the UI `Booking`. */
export function toUIBooking(b: BookingWithRelations): Booking {
  const hours = Math.max(
    0,
    Math.round((b.endAt.getTime() - b.startAt.getTime()) / 3_600_000),
  );
  const reviewCount = b.guest.reviews.length;
  const guestRating = reviewCount
    ? Math.round(
        (b.guest.reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviewCount) *
          10,
      ) / 10
    : 0;
  const verified = b.guest.user.kycSubmissions.some(
    (submission) => submission.status === "approved",
  );
  return {
    id: b.id,
    code: b.id.slice(0, 6).toUpperCase(),
    spaceId: b.spaceId,
    bookingLevel: (b.bookingLevel as "space" | "seat") ?? "space",
    quantity: b.quantity ?? 1,
    spaceTitle: b.space.name,
    spaceImage: cover(b.space.images),
    guestId: b.guestId,
    guestName: b.guest.user.name,
    guestAvatar: optimizeImageUrl(b.guest.user.avatarUrl || AVATAR_PLACEHOLDER, {
      width: 160,
      quality: 55,
    }),
    guestProfession: b.guest.profession ?? undefined,
    guestLicense: b.guest.license ?? undefined,
    guestVerified: verified,
    guestJoinedAt: joined(b.guest.createdAt),
    guestUsageCount: b.guest.bookings.filter(
      (booking) => booking.status !== "cancelled" && booking.status !== "rejected",
    ).length,
    guestRating,
    guestReviewCount: reviewCount,
    date: `${b.startAt.getFullYear()}年${b.startAt.getMonth() + 1}月${b.startAt.getDate()}日`,
    start: hhmm(b.startAt),
    end: hhmm(b.endAt),
    hours,
    total: b.totalPrice,
    hostEarnings: Math.max(0, b.totalPrice - b.platformFee),
    status: STATUS_MAP[b.status] ?? "pending",
    message: b.discountNote ?? undefined,
  };
}

export function toUIHostBookingListItem(b: HostBookingListRow): Booking {
  const hours = Math.max(
    0,
    Math.round((b.endAt.getTime() - b.startAt.getTime()) / 3_600_000),
  );
  return {
    id: b.id,
    code: b.id.slice(0, 6).toUpperCase(),
    spaceId: b.spaceId,
    bookingLevel: (b.bookingLevel as "space" | "seat") ?? "space",
    quantity: b.quantity ?? 1,
    spaceTitle: b.space.name,
    spaceImage: cover(b.space.images),
    guestId: b.guestId,
    guestName: b.guest.user.name,
    guestAvatar: optimizeImageUrl(b.guest.user.avatarUrl || AVATAR_PLACEHOLDER, {
      width: 160,
      quality: 55,
    }),
    date: `${b.startAt.getFullYear()}年${b.startAt.getMonth() + 1}月${b.startAt.getDate()}日`,
    start: hhmm(b.startAt),
    end: hhmm(b.endAt),
    hours,
    total: b.totalPrice,
    hostEarnings: Math.max(0, b.totalPrice - b.platformFee),
    status: STATUS_MAP[b.status] ?? "pending",
    message: b.discountNote ?? undefined,
  };
}

export function toUIGuestBookingListItem(b: GuestBookingListRow): Booking {
  const hours = Math.max(
    0,
    Math.round((b.endAt.getTime() - b.startAt.getTime()) / 3_600_000),
  );
  return {
    id: b.id,
    code: b.id.slice(0, 6).toUpperCase(),
    spaceId: b.spaceId,
    bookingLevel: (b.bookingLevel as "space" | "seat") ?? "space",
    quantity: b.quantity ?? 1,
    spaceTitle: b.space.name,
    spaceImage: cover(b.space.images),
    guestId: b.guestId,
    guestName: "",
    guestAvatar: "",
    date: `${b.startAt.getFullYear()}年${b.startAt.getMonth() + 1}月${b.startAt.getDate()}日`,
    start: hhmm(b.startAt),
    end: hhmm(b.endAt),
    hours,
    total: b.totalPrice,
    hostEarnings: Math.max(0, b.totalPrice - b.platformFee),
    status: STATUS_MAP[b.status] ?? "pending",
    message: b.discountNote ?? undefined,
  };
}

export function toUIPendingHostBookingItem(b: PendingHostBookingRow): Booking {
  const hours = Math.max(
    0,
    Math.round((b.endAt.getTime() - b.startAt.getTime()) / 3_600_000),
  );
  return {
    id: b.id,
    code: b.id.slice(0, 6).toUpperCase(),
    spaceId: b.spaceId,
    bookingLevel: (b.bookingLevel as "space" | "seat") ?? "space",
    quantity: b.quantity ?? 1,
    spaceTitle: b.spaceTitle,
    spaceImage: COVER_PLACEHOLDER,
    guestId: b.guestId,
    guestName: b.guestName,
    guestAvatar: optimizeImageUrl(b.guestAvatar || AVATAR_PLACEHOLDER, {
      width: 160,
      quality: 55,
    }),
    guestProfession: b.guestProfession ?? undefined,
    guestLicense: b.guestLicense ?? undefined,
    guestVerified: b.guestVerified,
    guestJoinedAt: joined(b.guestJoinedAt),
    guestUsageCount: b.guestUsageCount ?? 0,
    guestRating: b.guestRating ? Math.round(b.guestRating * 10) / 10 : 0,
    guestReviewCount: b.guestReviewCount ?? 0,
    date: `${b.startAt.getFullYear()}年${b.startAt.getMonth() + 1}月${b.startAt.getDate()}日`,
    start: hhmm(b.startAt),
    end: hhmm(b.endAt),
    hours,
    total: b.totalPrice,
    hostEarnings: Math.max(0, b.totalPrice - b.platformFee),
    status: STATUS_MAP[b.status] ?? "pending",
    message: b.discountNote ?? undefined,
  };
}
