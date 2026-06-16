"use server";

import { revalidatePath } from "next/cache";
import {
  setHostApplicationStatus,
  setGuestApplicationStatus,
  setKycStatus,
  markSettlementPaid,
  setUserStatus,
  recordAudit,
} from "@/lib/repositories/adminRepository";
import {
  notifyKycReviewed,
  notifyPayoutCompleted,
} from "@/lib/repositories/notificationRepository";
import type { ApplicationKind } from "@/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/kyc");
  revalidatePath("/admin/settlements");
  revalidatePath("/admin/users");
  revalidatePath("/admin/logs");
}

export async function setApplicationStatusAction(
  kind: ApplicationKind,
  id: string,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  try {
    if (kind === "host") await setHostApplicationStatus(id, status);
    else await setGuestApplicationStatus(id, status);
    await recordAudit(
      status === "approved" ? "approve" : "reject",
      `${kind}_application`,
      id,
    );
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    console.error("[setApplicationStatus] failed:", e);
    return { ok: false, error: "更新に失敗しました。" };
  }
}

export async function setKycStatusAction(
  id: string,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  try {
    await setKycStatus(id, status);
    await notifyKycReviewed(id, status);
    await recordAudit(status === "approved" ? "approve" : "reject", "kyc", id);
    revalidateAdmin();
    revalidatePath("/me");
    revalidatePath("/me/notifications");
    revalidatePath("/admin/notifications");
    return { ok: true };
  } catch (e) {
    console.error("[setKycStatus] failed:", e);
    return { ok: false, error: "更新に失敗しました。" };
  }
}

export async function paySettlementAction(id: string): Promise<ActionResult> {
  try {
    await markSettlementPaid(id);
    await notifyPayoutCompleted(id);
    await recordAudit("payout", "settlement", id);
    revalidatePath("/admin/settlements");
    revalidatePath("/admin/logs");
    revalidatePath("/host/earnings");
    revalidatePath("/me/notifications");
    revalidatePath("/host/notifications");
    return { ok: true };
  } catch (e) {
    console.error("[paySettlement] failed:", e);
    return { ok: false, error: "振込に失敗しました。" };
  }
}

export async function setUserStatusAction(
  id: string,
  status: "active" | "suspended",
): Promise<ActionResult> {
  try {
    await setUserStatus(id, status);
    await recordAudit(status === "suspended" ? "suspend" : "activate", "user", id);
    revalidatePath("/admin/users");
    revalidatePath("/admin/logs");
    return { ok: true };
  } catch (e) {
    console.error("[setUserStatus] failed:", e);
    return { ok: false, error: "更新に失敗しました。" };
  }
}
