"use server";

import { revalidatePath } from "next/cache";
import { updateBookingStatus } from "@/lib/repositories/bookingRepository";
import { notifyBookingReviewed } from "@/lib/repositories/notificationRepository";
import type { BookingRejectionReasonCode } from "@/lib/bookingRejectionTemplates";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Host approves or rejects a pending booking request. */
export async function setBookingStatusAction(
  bookingId: string,
  status: "approved" | "rejected",
  rejection?: {
    reasonCode: BookingRejectionReasonCode;
    message: string;
  },
): Promise<ActionResult> {
  try {
    await updateBookingStatus(bookingId, status);
    await notifyBookingReviewed(bookingId, status, rejection);
    revalidatePath("/host/bookings");
    revalidatePath("/host/dashboard");
    revalidatePath("/guest/bookings");
    revalidatePath("/me");
    revalidatePath("/me/notifications");
    revalidatePath("/host/notifications");
    return { ok: true };
  } catch (e) {
    console.error("[setBookingStatus] failed:", e);
    return { ok: false, error: "更新に失敗しました。" };
  }
}
