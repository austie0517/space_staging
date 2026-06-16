"use server";

import { revalidatePath } from "next/cache";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import {
  setLineConnected,
  updateLineNotif,
} from "@/lib/repositories/lineConnectionRepository";
import { NOTIF_COLUMN } from "@/lib/mappers/lineConnection";
import type { LineNotificationKey } from "@/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function connectLineAction(): Promise<ActionResult> {
  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ログインが必要です。" };
  try {
    await setLineConnected(guest.userId, true, guest.user.name);
    revalidatePath("/me/settings");
    return { ok: true };
  } catch (e) {
    console.error("[connectLine] failed:", e);
    return { ok: false, error: "連携に失敗しました。" };
  }
}

export async function disconnectLineAction(): Promise<ActionResult> {
  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ログインが必要です。" };
  try {
    await setLineConnected(guest.userId, false, null);
    revalidatePath("/me/settings");
    return { ok: true };
  } catch (e) {
    console.error("[disconnectLine] failed:", e);
    return { ok: false, error: "解除に失敗しました。" };
  }
}

export async function setLineNotifAction(
  key: LineNotificationKey,
  value: boolean,
): Promise<ActionResult> {
  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ログインが必要です。" };
  try {
    await updateLineNotif(guest.userId, { [NOTIF_COLUMN[key]]: value });
    revalidatePath("/me/settings");
    return { ok: true };
  } catch (e) {
    console.error("[setLineNotif] failed:", e);
    return { ok: false, error: "更新に失敗しました。" };
  }
}
