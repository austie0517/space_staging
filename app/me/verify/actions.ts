"use server";

import { revalidatePath } from "next/cache";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { createKyc } from "@/lib/repositories/kycRepository";
import { notifyKycSubmitted } from "@/lib/repositories/notificationRepository";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Submit a KYC document. The image upload to storage is not wired yet, so we
 * record the submission (status pending) with the file name as a placeholder.
 */
export async function submitKycAction(input: {
  docType?: string;
  fileName?: string;
}): Promise<ActionResult> {
  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ログインが必要です。" };

  try {
    await createKyc({
      userId: guest.userId,
      docType: input.docType?.trim() || "本人確認書類",
      imageUrl: input.fileName ?? null, // TODO: upload to Supabase Storage
      status: "pending",
    });
    await notifyKycSubmitted(guest.userId, guest.user.name);
    revalidatePath("/me/verify");
    revalidatePath("/me");
    revalidatePath("/me/notifications");
    revalidatePath("/admin");
    revalidatePath("/admin/kyc");
    revalidatePath("/admin/notifications");
    return { ok: true };
  } catch (e) {
    console.error("[submitKyc] failed:", e);
    return { ok: false, error: "提出に失敗しました。" };
  }
}
