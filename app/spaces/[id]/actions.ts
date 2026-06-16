"use server";

import { revalidatePath } from "next/cache";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { isKycApproved } from "@/lib/repositories/kycRepository";
import {
  getSpace,
  getSpaceMinBookingHours,
} from "@/lib/repositories/spaceRepository";
import { getUIAvailabilities } from "@/lib/repositories/availabilityRepository";
import {
  createBooking,
  hasOverlappingResourceBooking,
} from "@/lib/repositories/bookingRepository";
import { notifyBookingRequested } from "@/lib/repositories/notificationRepository";
import type { Availability } from "@/types";

export type CreateBookingInput = {
  spaceId: string;
  date: string; // YYYY-MM-DD (local)
  startHour: number; // e.g. 10
  endHour: number; // e.g. 14 (24 = midnight close)
  guests: number;
  usageFee: number; // 利用料金
  serviceFee: number; // サービス手数料
  total: number;
};

export type CreateBookingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const pad = (n: number) => String(n).padStart(2, "0");
const ymdOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hourFromHHMM = (value: string) => Number(value.slice(0, 2));

function availabilityFor(date: Date, rules: Availability[]): Availability | null {
  const ymd = ymdOf(date);
  const dow = date.getDay();
  for (const rule of rules) {
    if (rule.exceptions.includes(ymd)) continue;
    if (rule.repeatUntil && ymd > rule.repeatUntil) continue;
    if (rule.repeatType === "daily") return rule;
    if (rule.repeatType === "monthly") return rule;
    if (rule.repeatType === "weekly" && rule.daysOfWeek.includes(dow)) {
      return rule;
    }
  }
  return null;
}

export async function createBookingAction(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ゲスト情報が見つかりません。" };
  if (!(await isKycApproved(guest.userId))) {
    return {
      ok: false,
      error: "本人確認が完了していないため、予約申請はできません。",
    };
  }

  // Build local timestamps; setHours(24) rolls to next-day 00:00 (midnight close).
  const startAt = new Date(`${input.date}T00:00:00`);
  startAt.setHours(input.startHour);
  const endAt = new Date(`${input.date}T00:00:00`);
  endAt.setHours(input.endHour);

  if (Number.isNaN(startAt.getTime()) || endAt <= startAt) {
    return { ok: false, error: "日時が正しくありません。" };
  }

  const space = await getSpace(input.spaceId);
  const availabilityResourceId = space?.parentSpaceId ?? input.spaceId;
  const rule = space
    ? availabilityFor(startAt, await getUIAvailabilities(availabilityResourceId))
    : null;
  if (!rule) {
    return { ok: false, error: "この日は予約を受け付けていません。" };
  }
  const bookingLevel = space?.parentSpaceId || space?.spaceType === "seat"
    ? "seat"
    : "space";
  if (
    rule.bookableLevel === "closed" ||
    (rule.bookableLevel === "seat" && bookingLevel !== "seat") ||
    (rule.bookableLevel === "space" && bookingLevel !== "space")
  ) {
    return { ok: false, error: "この日はこの予約タイプを受け付けていません。" };
  }

  const availableStart = hourFromHHMM(rule.startTime);
  const availableEnd = hourFromHHMM(rule.endTime);
  if (input.startHour < availableStart || input.endHour > availableEnd) {
    return { ok: false, error: "この時間帯は予約可能時間外です。" };
  }
  const minBookingHours = await getSpaceMinBookingHours(input.spaceId);
  if (input.endHour - input.startHour < minBookingHours) {
    return {
      ok: false,
      error: `最低利用時間は${minBookingHours}時間です。`,
    };
  }

  if (await hasOverlappingResourceBooking(input.spaceId, startAt, endAt)) {
    return { ok: false, error: "この時間帯はすでに予約されています。" };
  }

  try {
    const booking = await createBooking({
      spaceId: input.spaceId,
      guestId: guest.id,
      bookingLevel,
      quantity: Math.max(1, input.guests),
      startAt,
      endAt,
      status: "pending",
      subtotal: input.usageFee,
      discountAmount: 0,
      optionTotal: 0,
      platformFee: input.serviceFee,
      tax: 0,
      totalPrice: input.total,
    });
    await notifyBookingRequested(booking.id);
    revalidatePath("/guest/bookings");
    revalidatePath("/host/bookings");
    revalidatePath("/host/dashboard");
    revalidatePath("/me/notifications");
    revalidatePath("/host/notifications");
    return { ok: true, id: booking.id };
  } catch (e) {
    // DB exclusion constraint (race-safe double-booking guard).
    if (e instanceof Error && e.message.includes("bookings_no_overlap")) {
      return { ok: false, error: "この時間帯はすでに予約されています。" };
    }
    console.error("[createBooking] failed:", e);
    return { ok: false, error: "予約の作成に失敗しました。" };
  }
}
