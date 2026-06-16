"use server";

import { revalidatePath } from "next/cache";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { updateBookingStatus } from "@/lib/repositories/bookingRepository";
import { createReview } from "@/lib/repositories/reviewRepository";
import {
  notifyBookingCancelled,
  notifyReviewPosted,
} from "@/lib/repositories/notificationRepository";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Guest cancels their own booking. */
export async function cancelBookingAction(
  bookingId: string,
): Promise<ActionResult> {
  try {
    await updateBookingStatus(bookingId, "cancelled");
    await notifyBookingCancelled(bookingId);
    revalidatePath("/guest/bookings");
    revalidatePath("/me");
    revalidatePath("/me/notifications");
    revalidatePath("/host/bookings");
    revalidatePath("/host/dashboard");
    revalidatePath("/host/notifications");
    return { ok: true };
  } catch (e) {
    console.error("[cancelBooking] failed:", e);
    return { ok: false, error: "キャンセルに失敗しました。" };
  }
}

/** Guest submits a review for a completed booking. */
export async function submitReviewAction(input: {
  bookingId: string;
  spaceId: string;
  rating: number;
  comment: string;
}): Promise<ActionResult> {
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "評価を選択してください。" };
  }
  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ゲスト情報が見つかりません。" };

  try {
    await createReview({
      bookingId: input.bookingId,
      spaceId: input.spaceId,
      guestId: guest.id,
      rating: input.rating,
      comment: input.comment.trim() || null,
    });
    await notifyReviewPosted(input.bookingId);
    revalidatePath(`/spaces/${input.spaceId}`);
    revalidatePath("/guest/bookings");
    revalidatePath("/me/notifications");
    revalidatePath("/host/notifications");
    return { ok: true };
  } catch (e) {
    console.error("[submitReview] failed:", e);
    return { ok: false, error: "レビューの投稿に失敗しました。" };
  }
}
