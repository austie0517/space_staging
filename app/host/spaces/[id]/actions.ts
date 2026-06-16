"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getSpace,
  updateSpace,
  updateSpaceMinBookingHours,
  updateSpaceResourceClassification,
  deleteSpace,
  replaceSpaceImages,
  upsertHourlyPrice,
} from "@/lib/repositories/spaceRepository";
import { notifySpaceApproved } from "@/lib/repositories/notificationRepository";
import {
  createAvailabilityRule,
  updateAvailabilityRule,
  deleteAvailability,
} from "@/lib/repositories/availabilityRepository";
import {
  createSpaceField,
  updateSpaceField,
  deleteSpaceField,
  swapSpaceFieldOrder,
  nextDisplayOrder,
  getSpaceFields,
} from "@/lib/repositories/spaceFieldRepository";
import { toggleSpaceTag } from "@/lib/repositories/spaceTagRepository";
import type { RepeatType, SpaceFieldType } from "@/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

const ok = { ok: true } as const;
const fail = (error: string): ActionResult => ({ ok: false, error });
const touch = (spaceId: string) => revalidatePath(`/host/spaces/${spaceId}`);
const pad = (n: number) => String(n).padStart(2, "0");
const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* ---------------------------------------------------------------- settings */

export async function saveSpaceSettingsAction(input: {
  spaceId: string;
  name: string;
  capacity: number;
  pricePerHour: number;
  minBookingHours: number;
  resourceCategory: string;
  spaceType: string;
  capacityUnit: string;
  pitchTitle: string;
  pitchBody: string;
  published: boolean;
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  building: string;
  lat: number | null;
  lng: number | null;
  imageUrls: string[];
}): Promise<ActionResult> {
  if (!input.name.trim()) return fail("スペース名を入力してください。");
  const minBookingHours = Math.trunc(input.minBookingHours);
  if (
    !Number.isFinite(minBookingHours) ||
    minBookingHours < 1 ||
    minBookingHours > 24
  ) {
    return fail("最低利用時間は1〜24時間で入力してください。");
  }
  const opt = (s: string) => (s.trim() ? s.trim() : null);
  try {
    const current = await getSpace(input.spaceId);
    await updateSpace(input.spaceId, {
      name: input.name.trim(),
      capacity: input.capacity,
      pitchTitle: opt(input.pitchTitle),
      pitchBody: opt(input.pitchBody),
      status: input.published ? "approved" : "draft",
      zipcode: opt(input.zipcode),
      prefecture: opt(input.prefecture),
      city: opt(input.city),
      town: opt(input.town),
      building: opt(input.building),
      lat: input.lat,
      lng: input.lng,
    });
    await updateSpaceMinBookingHours(input.spaceId, minBookingHours);
    await updateSpaceResourceClassification({
      id: input.spaceId,
      resourceCategory: input.resourceCategory,
      spaceType: input.spaceType,
      capacityUnit: input.capacityUnit,
    });
    await replaceSpaceImages(input.spaceId, input.imageUrls);
    await upsertHourlyPrice(input.spaceId, input.pricePerHour);
    if (
      input.published &&
      current &&
      !["approved", "published"].includes(current.status)
    ) {
      await notifySpaceApproved({
        hostUserId: current.host.userId,
        spaceName: input.name.trim(),
      });
    }
    touch(input.spaceId);
    revalidatePath("/host/spaces");
    revalidatePath("/host/dashboard");
    revalidatePath("/spaces");
    revalidatePath(`/spaces/${input.spaceId}`);
    revalidatePath("/me/notifications");
    revalidatePath("/host/notifications");
    return ok;
  } catch (e) {
    console.error("[saveSpaceSettings] failed:", e);
    return fail("保存に失敗しました。");
  }
}

export async function deleteSpaceAction(spaceId: string): Promise<void> {
  await deleteSpace(spaceId);
  revalidatePath("/host/spaces");
  revalidatePath("/host/dashboard");
  redirect("/host/dashboard");
}

/* ------------------------------------------------------------ availabilities */

export async function addAvailabilityAction(input: {
  spaceId: string;
  startTime: string;
  endTime: string;
  repeatType: RepeatType;
  repeatUntil?: string;
  daysOfWeek: number[];
  exceptions: string[];
}): Promise<ActionResult> {
  if (input.startTime >= input.endTime) {
    return fail("終了は開始より後の時刻にしてください。");
  }
  try {
    await createAvailabilityRule({
      spaceId: input.spaceId,
      repeatType: input.repeatType,
      startDate: todayYMD(),
      endDate: input.repeatUntil ?? null,
      startTime: input.startTime,
      endTime: input.endTime,
      dayOfWeek: input.repeatType === "weekly" ? input.daysOfWeek : [],
      exceptionDates: input.exceptions,
    });
    touch(input.spaceId);
    return ok;
  } catch (e) {
    console.error("[addAvailability] failed:", e);
    return fail("ルールの追加に失敗しました。");
  }
}

export async function updateAvailabilityAction(input: {
  id: string;
  spaceId: string;
  startTime: string;
  endTime: string;
  repeatType: RepeatType;
  repeatUntil?: string;
  daysOfWeek: number[];
  exceptions: string[];
}): Promise<ActionResult> {
  if (input.startTime >= input.endTime) {
    return fail("終了は開始より後の時刻にしてください。");
  }
  try {
    await updateAvailabilityRule(input.id, {
      repeatType: input.repeatType,
      endDate: input.repeatUntil ?? null,
      startTime: input.startTime,
      endTime: input.endTime,
      dayOfWeek: input.repeatType === "weekly" ? input.daysOfWeek : [],
      exceptionDates: input.exceptions,
    });
    touch(input.spaceId);
    return ok;
  } catch (e) {
    console.error("[updateAvailability] failed:", e);
    return fail("ルールの更新に失敗しました。");
  }
}

export async function deleteAvailabilityAction(
  id: string,
  spaceId: string,
): Promise<ActionResult> {
  try {
    await deleteAvailability(id);
    touch(spaceId);
    return ok;
  } catch (e) {
    console.error("[deleteAvailability] failed:", e);
    return fail("削除に失敗しました。");
  }
}

/* -------------------------------------------------------------- space fields */

export async function addSpaceFieldAction(input: {
  spaceId: string;
  key: string;
  label: string;
  value: string;
  type: SpaceFieldType;
  isPublic: boolean;
}): Promise<ActionResult> {
  if (!input.label.trim()) return fail("項目名を入力してください。");
  try {
    await createSpaceField({
      spaceId: input.spaceId,
      fieldKey: input.key.trim() || input.label.trim(),
      fieldLabel: input.label.trim(),
      fieldValue: input.value.trim() || null,
      fieldType: input.type,
      isPublic: input.isPublic,
      displayOrder: await nextDisplayOrder(input.spaceId),
    });
    touch(input.spaceId);
    return ok;
  } catch (e) {
    console.error("[addSpaceField] failed:", e);
    return fail("項目の追加に失敗しました。");
  }
}

export async function setSpaceFieldPublicAction(
  id: string,
  spaceId: string,
  isPublic: boolean,
): Promise<ActionResult> {
  try {
    await updateSpaceField(id, { isPublic });
    touch(spaceId);
    return ok;
  } catch (e) {
    console.error("[setSpaceFieldPublic] failed:", e);
    return fail("更新に失敗しました。");
  }
}

export async function deleteSpaceFieldAction(
  id: string,
  spaceId: string,
): Promise<ActionResult> {
  try {
    await deleteSpaceField(id);
    touch(spaceId);
    return ok;
  } catch (e) {
    console.error("[deleteSpaceField] failed:", e);
    return fail("削除に失敗しました。");
  }
}

export async function toggleSpaceTagAction(
  spaceId: string,
  tagId: string,
): Promise<ActionResult> {
  try {
    await toggleSpaceTag(spaceId, tagId);
    touch(spaceId);
    revalidatePath(`/spaces/${spaceId}`);
    return ok;
  } catch (e) {
    console.error("[toggleSpaceTag] failed:", e);
    return fail("更新に失敗しました。");
  }
}

export async function moveSpaceFieldAction(
  spaceId: string,
  id: string,
  dir: -1 | 1,
): Promise<ActionResult> {
  try {
    const fields = await getSpaceFields(spaceId);
    const i = fields.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= fields.length) return ok;
    await swapSpaceFieldOrder(fields[i].id, fields[j].id);
    touch(spaceId);
    return ok;
  } catch (e) {
    console.error("[moveSpaceField] failed:", e);
    return fail("並べ替えに失敗しました。");
  }
}
