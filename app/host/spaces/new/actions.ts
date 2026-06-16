"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentHost } from "@/lib/repositories/hostRepository";
import {
  createSpace,
  replaceSpaceImages,
  upsertHourlyPrice,
  updateSpaceResourceClassification,
} from "@/lib/repositories/spaceRepository";
import {
  notifySpaceApproved,
  notifySpaceSubmitted,
} from "@/lib/repositories/notificationRepository";

export type CreateSpaceInput = {
  name: string;
  resourceCategory: string;
  spaceType: string;
  capacityUnit: string;
  description: string;
  pitchTitle: string;
  pitchBody: string;
  capacity: number;
  minBookingHours: number;
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  building: string;
  lat: number | null;
  lng: number | null;
  imageUrls: string[];
  pricePerHour: number;
  published: boolean;
};

export type CreateSpaceResult = { ok: false; error: string };

const opt = (s: string) => (s.trim() ? s.trim() : null);

/**
 * Create a new space for the current host (+ its hourly price option), then
 * redirect to its management page. Photo upload is not wired yet, so the space
 * starts without images.
 */
export async function createSpaceAction(
  input: CreateSpaceInput,
): Promise<CreateSpaceResult> {
  const host = await getCurrentHost();
  if (!host) return { ok: false, error: "ホスト情報が見つかりません。" };
  if (!input.name.trim()) return { ok: false, error: "スペース名を入力してください。" };
  const minBookingHours = Math.trunc(input.minBookingHours);
  if (
    !Number.isFinite(minBookingHours) ||
    minBookingHours < 1 ||
    minBookingHours > 24
  ) {
    return { ok: false, error: "最低利用時間は1〜24時間で入力してください。" };
  }

  let spaceId: string;
  try {
    const space = await createSpace({
      hostId: host.id,
      name: input.name.trim(),
      spaceType: input.spaceType,
      status: input.published ? "approved" : "draft",
      description: opt(input.description),
      pitchTitle: opt(input.pitchTitle),
      pitchBody: opt(input.pitchBody),
      minBookingHours,
      capacity: input.capacity,
      zipcode: opt(input.zipcode),
      prefecture: opt(input.prefecture),
      city: opt(input.city),
      town: opt(input.town),
      building: opt(input.building),
      lat: input.lat,
      lng: input.lng,
    });
    spaceId = space.id;
    if (input.pricePerHour > 0) {
      await upsertHourlyPrice(spaceId, input.pricePerHour);
    }
    await replaceSpaceImages(spaceId, input.imageUrls);
    await updateSpaceResourceClassification({
      id: spaceId,
      resourceCategory: input.resourceCategory,
      spaceType: input.spaceType,
      capacityUnit: input.capacityUnit,
    });
    await notifySpaceSubmitted({
      hostUserId: host.userId,
      hostName: host.user.name,
      spaceName: input.name.trim(),
    });
    if (input.published) {
      await notifySpaceApproved({
        hostUserId: host.userId,
        spaceName: input.name.trim(),
      });
    }
  } catch (e) {
    console.error("[createSpace] failed:", e);
    return { ok: false, error: "登録に失敗しました。" };
  }

  revalidatePath("/host/spaces");
  revalidatePath("/host/dashboard");
  revalidatePath("/me/notifications");
  revalidatePath("/host/notifications");
  revalidatePath("/admin");
  revalidatePath("/admin/spaces");
  revalidatePath("/admin/notifications");
  redirect(`/host/spaces/${spaceId}`);
}
