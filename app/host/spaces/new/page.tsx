"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Icon } from "../../../_components/ui";
import { createSpaceAction } from "./actions";
import {
  CAPACITY_UNITS,
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  defaultCapacityUnit,
  type ResourceTypeValue,
} from "@/lib/resourceClassification";
import {
  buildFullAddress,
  fetchAddressByZip,
  fetchLatLng,
  formatZipcode,
} from "@/lib/address";

export default function NewSpacePage() {
  const [form, setForm] = useState({
    name: "",
    price: 3000,
    capacity: 1,
    minBookingHours: 1,
    resourceCategory: "venue",
    spaceType: "booth",
    capacityUnit: "person",
    description: "",
    pitchTitle: "",
    pitchBody: "",
    zipcode: "",
    prefecture: "",
    city: "",
    town: "",
    building: "",
    imageUrls: [""],
    isPublished: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressLookupStatus, setAddressLookupStatus] = useState<
    "idle" | "loading" | "found" | "notFound"
  >("idle");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [k]: v }));

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

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const coords = await fetchLatLng(
      buildFullAddress({
        prefecture: form.prefecture,
        city: form.city,
        town: form.town,
        building: form.building,
      }),
    );
    const res = await createSpaceAction({
      name: form.name,
      resourceCategory: form.resourceCategory,
      spaceType: form.spaceType,
      capacityUnit: form.capacityUnit,
      description: form.description,
      pitchTitle: form.pitchTitle,
      pitchBody: form.pitchBody,
      capacity: form.capacity,
      minBookingHours: form.minBookingHours,
      zipcode: form.zipcode,
      prefecture: form.prefecture,
      city: form.city,
      town: form.town,
      building: form.building,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      imageUrls: form.imageUrls,
      pricePerHour: form.price,
      published: form.isPublished,
    });
    setSubmitting(false);
    if (!res.ok) setError(res.error);
  };

  const resourceTypeOptions =
    RESOURCE_CATEGORIES.find((category) => category.value === form.resourceCategory)
      ?.resourceTypes ?? RESOURCE_TYPES.map((item) => item.value);

  return (
    <div className="min-h-screen bg-surface-low pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface-card px-5 py-3">
        <Link
          href="/host/spaces"
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-low"
          aria-label="閉じる"
        >
          <Icon name="close" />
        </Link>
        <p className="font-display text-lg text-on-surface">スペース登録</p>
        <span className="w-9" />
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-6">
        <Card title="基本設定">
          <Setting label="スペース名">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="例：ヘアサロン向けブース A"
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
          <Setting label="収容数">
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
        </Card>

        <Card title="紹介文">
          <Setting label="説明">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="スペースの特徴・利用シーンなどを記載してください"
              className="settings-input resize-none"
            />
          </Setting>
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
        </Card>

        <Card title="画像">
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
        </Card>

        <Card title="住所">
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
                readOnly
                placeholder="東京都"
                className="settings-input bg-surface-low text-on-surface-variant"
              />
            </Setting>
            <Setting label="市区町村">
              <input
                value={form.city}
                readOnly
                placeholder="渋谷区"
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
        </Card>

        <Card title="公開設定">
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
        </Card>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-error">
            <Icon name="error" className="text-[18px]" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Link href="/host/spaces" className="text-sm text-on-surface-variant hover:underline">
            ← スペース一覧へ
          </Link>
          <Button disabled={submitting} onClick={submit}>
            {submitting ? "登録中..." : "スペースを登録"}
          </Button>
        </div>
      </main>

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

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-5">
      <h3 className="mb-4 font-display text-lg text-on-surface">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
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
