"use server";

import { revalidatePath } from "next/cache";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { toggleFavorite } from "@/lib/repositories/favoriteRepository";

export type ToggleFavoriteResult =
  | { ok: true; isFavorite: boolean }
  | { ok: false; error: string };

/** Add/remove a space from the current user's favorites. */
export async function toggleFavoriteAction(
  spaceId: string,
): Promise<ToggleFavoriteResult> {
  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ログインが必要です。" };

  try {
    const isFavorite = await toggleFavorite(guest.userId, spaceId);
    revalidatePath("/me/favorites");
    return { ok: true, isFavorite };
  } catch (e) {
    console.error("[toggleFavorite] failed:", e);
    return { ok: false, error: "お気に入りの更新に失敗しました。" };
  }
}
