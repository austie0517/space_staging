"use server";

import { revalidatePath } from "next/cache";
import {
  getCurrentHost,
  updateHostProfile,
} from "@/lib/repositories/hostRepository";
import { setUserAvatar } from "@/lib/repositories/guestRepository";
import { recordAudit } from "@/lib/repositories/adminRepository";
import { supabaseAdmin } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export async function updateHostProfileAction(input: {
  name: string;
  email: string;
  phone: string;
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  building: string;
  lat: number | null;
  lng: number | null;
}): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "お名前を入力してください。" };

  const host = await getCurrentHost();
  if (!host) return { ok: false, error: "ホスト情報が見つかりません。" };
  const nextPhone = input.phone.trim();
  const changedFields = [
    host.user.name !== name ? "name" : null,
    (host.user.phone ?? "") !== nextPhone ? "phone" : null,
  ].filter(Boolean);

  try {
    await updateHostProfile({
      hostId: host.id,
      userId: host.userId,
      name,
      email: input.email.trim(),
      phone: nextPhone,
      zipcode: input.zipcode,
      prefecture: input.prefecture,
      city: input.city,
      town: input.town,
      building: input.building,
      lat: input.lat,
      lng: input.lng,
    });
    if (changedFields.length > 0) {
      await recordAudit(
        "profile_update",
        `host_profile:${changedFields.join(",")}`,
        host.userId,
        host.userId,
      );
    }
    revalidatePath("/host/me");
    return { ok: true };
  } catch (e) {
    console.error("[updateHostProfile] failed:", e);
    return { ok: false, error: "保存に失敗しました。" };
  }
}

export type UploadAvatarResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadHostAvatarAction(
  formData: FormData,
): Promise<UploadAvatarResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "画像が選択されていません。" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "画像ファイルを選択してください。" };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { ok: false, error: "写真は5MB以下の画像を選択してください。" };
  }

  const host = await getCurrentHost();
  if (!host) return { ok: false, error: "ホスト情報が見つかりません。" };

  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${host.userId}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;

    const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    await setUserAvatar(host.userId, url);
    revalidatePath("/host/me");
    return { ok: true, url };
  } catch (e) {
    console.error("[uploadHostAvatar] failed:", e);
    return { ok: false, error: "アップロードに失敗しました。" };
  }
}
