"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon } from "../../../_components/ui";
import { Tabs } from "../../../_components/Tabs";
import { HostHeader } from "../../../_components/HostHeader";
import { HostNav } from "../../../_components/HostNav";
import type { Availability, Booking, Space, SpaceField } from "@/types";
import type { CalendarBooking } from "@/lib/mappers/booking";
import { SpaceFieldsEditor } from "./SpaceFieldsEditor";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { SpaceCalendar } from "./SpaceCalendar";
import { AmenityEditor, type AmenityTag } from "./AmenityEditor";
import { saveSpaceSettingsAction, deleteSpaceAction } from "./actions";
import { ApprovalDialog } from "../../dashboard/ApprovalDialog";
import {
  CAPACITY_UNITS,
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  defaultCapacityUnit,
  type ResourceTypeValue,
} from "@/lib/resourceClassification";
import { buildFullAddress, fetchAddressByZip, fetchLatLng, formatZipcode } from "@/lib/address";

export type SpaceAddress = {
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  building: string;
};

export function HostSpaceClient({
  space,
  published,
  address,
  imageUrls,
  upcoming,
  calendarBookings,
  availabilities,
  fields,
  allTags,
  tagIds,
}: {
  space: Space;
  published: boolean;
  address: SpaceAddress;
  imageUrls: string[];
  upcoming: Booking[];
  calendarBookings: CalendarBooking[];
  availabilities: Availability[];
  fields: SpaceField[];
  allTags: AmenityTag[];
  tagIds: string[];
}) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);

  const leave = (href: string) => {
    if (!dirty || confirm("変更が保存されていません。このページを離れますか？")) {
      router.push(href);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <HostHeader subtitle="スペース管理" />
      <div className="px-5 pb-4 pt-2">
        <button
          onClick={() => leave("/host/spaces")}
          className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Icon name="arrow_back" className="text-[16px]" /> スペース一覧へ
        </button>
        <h1 className="font-display text-3xl text-on-surface">{space.title}</h1>
        <p className="text-on-surface-variant">{space.area}</p>
      </div>

      <Tabs tabs={["概要", "カレンダー", "設定"]}>
        {(active) => (
          <div className="mx-auto max-w-2xl px-5 py-6">
            {active === 0 && <OverviewTab space={space} upcoming={upcoming} />}
            {active === 1 && (
              <CalendarTab
                spaceId={space.id}
                calendarBookings={calendarBookings}
                availabilities={availabilities}
              />
            )}
            {active === 2 && (
              <SettingsTab
                space={space}
                published={published}
                address={address}
                imageUrls={imageUrls}
                fields={fields}
                allTags={allTags}
                tagIds={tagIds}
                onDirtyChange={setDirty}
                onLeave={leave}
              />
            )}
          </div>
        )}
      </Tabs>

      <HostNav />
    </div>
  );
}

/* --------------------------------------------------------------- 概要 */

function OverviewTab({
  space,
  upcoming,
}: {
  space: Space;
  upcoming: Booking[];
}) {
  const [approving, setApproving] = useState<Booking | null>(null);

  return (
    <div className="flex flex-col gap-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={space.images[0]}
        alt={space.title}
        className="aspect-[16/9] w-full rounded-xl object-cover"
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="時間単価" value={`¥${space.pricePerHour.toLocaleString()}`} />
        <Stat label="収容人数" value={`${space.capacity}名`} />
        <Stat label="評価" value={`★ ${space.rating}`} />
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="font-display text-lg text-on-surface">
          {space.pitchTitle || "説明"}
        </h3>
        <p className="mt-2 leading-relaxed text-on-surface-variant">
          {space.pitchBody || space.description || "紹介文は未設定です。"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-3 font-display text-lg text-on-surface">
          今後の予約（{upcoming.length}）
        </h3>
        <div className="flex flex-col gap-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-on-surface-variant">予約はありません。</p>
          )}
          {upcoming.map((b) =>
            b.status === "pending" ? (
              <button
                key={b.id}
                type="button"
                onClick={() => setApproving(b)}
                className="-mx-2 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary-container/10 p-2 text-left transition hover:bg-primary-container/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                aria-label={`${b.guestName}さんの予約リクエストを承認する`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.guestAvatar}
                  alt={b.guestName}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {b.guestName}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {b.date} {b.start}–{b.end}
                  </p>
                </div>
                <Badge tone="warning">承認待ち</Badge>
                <Icon name="chevron_right" className="text-[20px] text-primary" />
              </button>
            ) : (
              <div
                key={b.id}
                className="-mx-2 flex items-center gap-3 rounded-lg border border-transparent p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.guestAvatar}
                  alt={b.guestName}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {b.guestName}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {b.date} {b.start}–{b.end}
                  </p>
                </div>
                <Badge tone={b.status === "confirmed" ? "primary" : "warning"}>
                  {b.status === "confirmed" ? "確定" : "承認待ち"}
                </Badge>
              </div>
            ),
          )}
        </div>
      </div>
      <ApprovalDialog
        key={approving?.id ?? "closed"}
        booking={approving}
        onClose={() => setApproving(null)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-4 text-center">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-xl text-on-surface">{value}</p>
    </div>
  );
}

/* ----------------------------------------------------------- カレンダー */

function CalendarTab({
  spaceId,
  calendarBookings,
  availabilities,
}: {
  spaceId: string;
  calendarBookings: CalendarBooking[];
  availabilities: Availability[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Live month calendar (current month, today, bookings, availability) */}
      <SpaceCalendar bookings={calendarBookings} availabilities={availabilities} />

      {/* Recurring availability rules (availabilities) */}
      <AvailabilityEditor spaceId={spaceId} initial={availabilities} />
    </div>
  );
}

/* --------------------------------------------------------------- 設定 */

function SettingsTab({
  space,
  published,
  address,
  imageUrls,
  fields,
  allTags,
  tagIds,
  onDirtyChange,
  onLeave,
}: {
  space: Space;
  published: boolean;
  address: SpaceAddress;
  imageUrls: string[];
  fields: SpaceField[];
  allTags: AmenityTag[];
  tagIds: string[];
  onDirtyChange: (dirty: boolean) => void;
  onLeave: (href: string) => void;
}) {
  const router = useRouter();
  const initial = {
    name: space.title,
    price: space.pricePerHour,
    capacity: space.capacity,
    minBookingHours: space.minBookingHours,
    resourceCategory: space.resourceCategory,
    spaceType: space.spaceType,
    capacityUnit: space.capacityUnit,
    pitchTitle: space.pitchTitle,
    pitchBody: space.pitchBody,
    isPublished: published,
    imageUrls: imageUrls.length ? imageUrls : [""],
    ...address,
  };
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressLookupStatus, setAddressLookupStatus] = useState<
    "idle" | "loading" | "found" | "notFound"
  >("idle");
  const [deleting, startDelete] = useTransition();

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleZipcodeChange = async (value: string) => {
    const formatted = formatZipcode(value);
    set("zipcode", formatted);
    if (formatted.replace("-", "").length !== 7) {
      setAddressLookupStatus("idle");
      return;
    }

    setAddressLookupStatus("loading");
    const addr = await fetchAddressByZip(formatted);
    if (!addr) {
      setAddressLookupStatus("notFound");
      return;
    }
    setForm((current) => ({
      ...current,
      prefecture: addr.prefecture,
      city: addr.city,
      town: addr.town,
    }));
    setAddressLookupStatus("found");
  };

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  // Surface dirty state to the parent (for back-link warnings) + browser unload.
  useEffect(() => {
    onDirtyChange(dirty);
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, onDirtyChange]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    const coords = await fetchLatLng(
      buildFullAddress({
        prefecture: form.prefecture,
        city: form.city,
        town: form.town,
        building: form.building,
      }),
    );
    const res = await saveSpaceSettingsAction({
      spaceId: space.id,
      name: form.name,
      capacity: form.capacity,
      pricePerHour: form.price,
      minBookingHours: form.minBookingHours,
      resourceCategory: form.resourceCategory,
      spaceType: form.spaceType,
      capacityUnit: form.capacityUnit,
      pitchTitle: form.pitchTitle,
      pitchBody: form.pitchBody,
      published: form.isPublished,
      zipcode: form.zipcode,
      prefecture: form.prefecture,
      city: form.city,
      town: form.town,
      building: form.building,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      imageUrls: form.imageUrls,
    });
    setSaving(false);
    if (res.ok) {
      setBaseline(form); // clears dirty
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(res.error);
    }
  };

  const onDelete = () => {
    if (!confirm("このスペースを削除しますか？この操作は取り消せません。")) return;
    startDelete(() => {
      void deleteSpaceAction(space.id);
    });
  };

  const resourceTypeOptions =
    RESOURCE_CATEGORIES.find((category) => category.value === form.resourceCategory)
      ?.resourceTypes ?? RESOURCE_TYPES.map((type) => type.value);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-4 font-display text-lg text-on-surface">基本設定</h3>
        <div className="flex flex-col gap-4">
          <Setting label="スペース名">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="settings-input"
            />
          </Setting>
          <Setting label="カテゴリ">
            <select
              value={form.resourceCategory}
              onChange={(e) => {
                const nextCategory = e.target.value;
                const nextTypes =
                  RESOURCE_CATEGORIES.find(
                    (category) => category.value === nextCategory,
                  )?.resourceTypes ?? [];
                setForm((current) => ({
                  ...current,
                  resourceCategory: nextCategory,
                  spaceType: nextTypes.includes(current.spaceType as ResourceTypeValue)
                    ? current.spaceType
                    : (nextTypes[0] ?? current.spaceType),
                  capacityUnit: defaultCapacityUnit(nextCategory),
                }));
              }}
              className="settings-input"
            >
              {RESOURCE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </Setting>
          <div className="grid grid-cols-2 gap-3">
            <Setting label="予約タイプ">
              <select
                value={form.spaceType}
                onChange={(e) => set("spaceType", e.target.value)}
                className="settings-input"
              >
                {RESOURCE_TYPES.filter((type) =>
                  resourceTypeOptions.includes(type.value),
                ).map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Setting>
            <Setting label="収容単位">
              <select
                value={form.capacityUnit}
                onChange={(e) => set("capacityUnit", e.target.value)}
                className="settings-input"
              >
                {CAPACITY_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </Setting>
          </div>
          <Setting label="時間単価（¥）">
            <input
              type="number"
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
              className="settings-input"
            />
          </Setting>
          <Setting label="収容人数">
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => set("capacity", Number(e.target.value))}
              className="settings-input"
            />
          </Setting>
          <Setting label="最低利用時間">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={24}
                value={form.minBookingHours}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  set(
                    "minBookingHours",
                    Number.isFinite(next) ? Math.min(24, Math.max(1, next)) : 1,
                  );
                }}
                className="settings-input max-w-28"
              />
              <span className="text-sm text-on-surface-variant">時間から予約可</span>
            </div>
          </Setting>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-4 font-display text-lg text-on-surface">紹介文</h3>
        <div className="flex flex-col gap-4">
          <Setting label="紹介タイトル">
            <input
              value={form.pitchTitle}
              onChange={(e) => set("pitchTitle", e.target.value)}
              maxLength={120}
              placeholder="例：自然光で作品が映える、静かな撮影ブース"
              className="settings-input"
            />
          </Setting>
          <Setting label="紹介詳細">
            <textarea
              value={form.pitchBody}
              onChange={(e) => set("pitchBody", e.target.value)}
              rows={6}
              placeholder="空間の雰囲気、向いている用途、利用者に伝えたいこだわりを記載してください。"
              className="settings-input resize-none leading-relaxed"
            />
          </Setting>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-4 font-display text-lg text-on-surface">画像</h3>
        <div className="flex flex-col gap-4">
          {form.imageUrls.map((url, index) => (
            <Setting
              key={index}
              label={index === 0 ? "カバー画像URL" : `画像URL ${index + 1}`}
            >
              <input
                value={url}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    imageUrls: current.imageUrls.map((item, i) =>
                      i === index ? e.target.value : item,
                    ),
                  }))
                }
                placeholder="https://..."
                className="settings-input"
              />
            </Setting>
          ))}
          {form.imageUrls.length < 5 && (
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  imageUrls: [...current.imageUrls, ""],
                }))
              }
              className="self-start text-sm font-semibold text-primary hover:underline"
            >
              ＋ 画像URLを追加
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-4 font-display text-lg text-on-surface">住所</h3>
        <div className="flex flex-col gap-4">
          <Setting label="郵便番号">
            <input
              value={form.zipcode}
              onChange={(e) => {
                void handleZipcodeChange(e.target.value);
              }}
              placeholder="123-4567"
              className="settings-input"
            />
            {addressLookupStatus !== "idle" && (
              <p className="mt-1 text-xs text-on-surface-variant">
                {addressLookupStatus === "loading" && "住所を検索中..."}
                {addressLookupStatus === "found" && "住所を自動入力しました。"}
                {addressLookupStatus === "notFound" && "住所が見つかりませんでした。"}
              </p>
            )}
          </Setting>
          <div className="grid grid-cols-2 gap-3">
            <Setting label="都道府県">
              <input
                value={form.prefecture}
                placeholder="東京都"
                readOnly
                className="settings-input bg-surface-low text-on-surface-variant"
              />
            </Setting>
            <Setting label="市区町村">
              <input
                value={form.city}
                placeholder="渋谷区"
                readOnly
                className="settings-input bg-surface-low text-on-surface-variant"
              />
            </Setting>
          </div>
          <Setting label="番地">
            <input
              value={form.town}
              onChange={(e) => set("town", e.target.value)}
              placeholder="道玄坂1-2-3"
              className="settings-input"
            />
          </Setting>
          <Setting label="建物名・部屋番号">
            <input
              value={form.building}
              onChange={(e) => set("building", e.target.value)}
              placeholder="○○ビル3F"
              className="settings-input"
            />
          </Setting>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <h3 className="mb-4 font-display text-lg text-on-surface">公開設定</h3>
        <label className="flex items-center justify-between py-2">
          <span className="text-on-surface">スペースを公開する</span>
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="accent-[var(--color-primary)]"
          />
        </label>
        <p className="text-xs text-on-surface-variant">
          公開するとゲストの一覧・検索に表示されます。
        </p>
      </div>

      {/* Amenity catalog (space_tags) */}
      <AmenityEditor spaceId={space.id} allTags={allTags} selectedIds={tagIds} />

      {/* DB-managed display fields (space_fields) */}
      <SpaceFieldsEditor spaceId={space.id} initial={fields} />

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-error">
          <Icon name="error" className="text-[18px]" />
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => onLeave("/host/spaces")}
          className="text-sm text-on-surface-variant hover:underline"
        >
          ← スペース一覧へ
        </button>
        <Button disabled={saving} onClick={save}>
          {saved ? (
            <>
              <Icon name="check" className="text-[18px]" /> 保存しました
            </>
          ) : saving ? (
            "保存中..."
          ) : (
            "変更を保存"
          )}
        </Button>
      </div>

      <button
        onClick={onDelete}
        disabled={deleting}
        className="mt-4 self-start text-sm text-error hover:underline disabled:opacity-50"
      >
        {deleting ? "削除中..." : "このスペースを削除する"}
      </button>

      <style>{`
        .settings-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          padding: 0.6rem 0.9rem;
          outline: none;
        }
        .settings-input:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

function Setting({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-on-surface">{label}</span>
      {children}
    </label>
  );
}
