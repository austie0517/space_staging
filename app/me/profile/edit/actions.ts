"use server";

import { revalidatePath } from "next/cache";
import {
  getCurrentGuest,
  updateGuestProfile,
  setUserAvatar,
} from "@/lib/repositories/guestRepository";
import { recordAudit } from "@/lib/repositories/adminRepository";
import { supabaseAdmin } from "@/lib/supabase/server";

export type UpdateProfileInput = {
  name: string;
  email: string;
  phone: string;
  profession: string;
  license: string;
};

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "お名前を入力してください。" };

  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ゲスト情報が見つかりません。" };
  const nextPhone = input.phone.trim();
  const changedFields = [
    guest.user.name !== name ? "name" : null,
    (guest.user.phone ?? "") !== nextPhone ? "phone" : null,
  ].filter(Boolean);

  try {
    await updateGuestProfile({
      guestId: guest.id,
      userId: guest.userId,
      name,
      email: input.email.trim(),
      phone: nextPhone,
      profession: input.profession.trim(),
      license: input.license.trim(),
    });
    if (changedFields.length > 0) {
      await recordAudit(
        "profile_update",
        `guest_profile:${changedFields.join(",")}`,
        guest.userId,
        guest.userId,
      );
    }
    revalidatePath("/me");
    return { ok: true };
  } catch (e) {
    console.error("[updateProfile] failed:", e);
    return { ok: false, error: "保存に失敗しました。" };
  }
}

export type UploadAvatarResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Upload a profile photo to the `avatars` bucket and save users.avatar_url. */
export async function uploadAvatarAction(
  formData: FormData,
): Promise<UploadAvatarResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "画像が選択されていません。" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "画像ファイルを選択してください。" };
  }

  const guest = await getCurrentGuest();
  if (!guest) return { ok: false, error: "ゲスト情報が見つかりません。" };

  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${guest.userId}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;

    const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so a re-uploaded photo (same path) shows immediately.
    const url = `${data.publicUrl}?v=${Date.now()}`;
    await setUserAvatar(guest.userId, url);

    revalidatePath("/me");
    revalidatePath("/me/profile/edit");
    return { ok: true, url };
  } catch (e) {
    console.error("[uploadAvatar] failed:", e);
    return { ok: false, error: "アップロードに失敗しました。" };
  }
}
