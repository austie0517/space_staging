"use server";

import { revalidatePath } from "next/cache";
import {
  updateBookingStatus,
  refundBooking,
} from "@/lib/repositories/bookingRepository";
import { recordAudit } from "@/lib/repositories/adminRepository";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateBookings() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/logs");
  revalidatePath("/host/bookings");
  revalidatePath("/host/dashboard");
  revalidatePath("/guest/bookings");
  revalidatePath("/me");
}

/** Admin cancels a booking. */
export async function adminCancelBookingAction(
  id: string,
): Promise<ActionResult> {
  try {
    await updateBookingStatus(id, "cancelled");
    await recordAudit("cancel", "booking", id);
    revalidateBookings();
    return { ok: true };
  } catch (e) {
    console.error("[adminCancelBooking] failed:", e);
    return { ok: false, error: "キャンセルに失敗しました。" };
  }
}

/** Admin refunds a booking (cancels + marks payments refunded). */
export async function adminRefundBookingAction(
  id: string,
): Promise<ActionResult> {
  try {
    await refundBooking(id);
    await recordAudit("refund", "booking", id);
    revalidateBookings();
    return { ok: true };
  } catch (e) {
    console.error("[adminRefundBooking] failed:", e);
    return { ok: false, error: "返金に失敗しました。" };
  }
}
