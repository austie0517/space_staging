"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Space } from "@/types";
import { Chip, Icon, cn } from "../_components/ui";
import { DatePickerField } from "../_components/DatePickerField";
import { GuestNav } from "../_components/GuestNav";
import { useFavorites } from "../_components/useFavorites";
import {
  RESOURCE_CATEGORIES,
  capacityUnitLabel,
  resourceCategoryLabel,
  resourceTypeLabel,
} from "@/lib/resourceClassification";

const CATEGORIES = [
  { label: "すべて", value: "all", icon: "apps" },
  ...RESOURCE_CATEGORIES.map((category) => ({
    label: category.label,
    value: category.value,
    icon: category.icon,
  })),
];

type PriceBand = "all" | "low" | "mid" | "high";

const PRICE_BANDS: { key: PriceBand; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "low", label: "〜¥3,000" },
  { key: "mid", label: "¥3,000〜¥3,500" },
  { key: "high", label: "¥3,500〜" },
];

function inBand(price: number, band: PriceBand): boolean {
  if (band === "low") return price < 3000;
  if (band === "mid") return price >= 3000 && price < 3500;
  if (band === "high") return price >= 3500;
  return true;
}

export function SpacesClient({ initialSpaces }: { initialSpaces: Space[] }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [date, setDate] = useState("");

  const activeFilters = (priceBand !== "all" ? 1 : 0) + (date ? 1 : 0);

  const filtered = useMemo(() => {
    return initialSpaces.filter((s) => {
      const byCategory = category === "all" || s.resourceCategory === category;
      const byPrice = inBand(s.pricePerHour, priceBand);
      const q = query.trim();
      const bySearch =
        !q ||
        s.title.includes(q) ||
        s.area.includes(q) ||
        resourceCategoryLabel(s.resourceCategory)
          .toLowerCase()
          .includes(q.toLowerCase()) ||
        resourceTypeLabel(s.spaceType).toLowerCase().includes(q.toLowerCase());
      return byCategory && byPrice && bySearch;
    });
  }, [initialSpaces, category, query, priceBand]);

  return (
    <div className="min-h-full pb-24 md:pt-14">
      {/* Search app bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-surface/80 px-4 backdrop-blur-md md:top-14">
        <div className="flex w-full items-center rounded-full border border-border bg-surface-card px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-primary-container focus-within:ring-offset-2">
          <Icon name="location_on" className="text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="場所・スペース名を探す..."
            className="ml-2 w-full border-none bg-transparent text-[15px] text-on-surface outline-none placeholder:text-on-surface-variant/60"
          />
        </div>
        <Link
          href="/me/favorites"
          aria-label="お気に入り"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border bg-surface-card text-primary transition-opacity hover:opacity-80"
        >
          <Icon name="favorite" />
        </Link>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "relative flex h-10 w-10 flex-none items-center justify-center rounded-full border transition-colors",
            showFilters || activeFilters > 0
              ? "border-primary bg-primary text-on-primary"
              : "border-border bg-surface-card text-primary hover:opacity-80",
          )}
          aria-label="絞り込み"
        >
          <Icon name="tune" />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">
              {activeFilters}
            </span>
          )}
        </button>
      </header>

      {/* Filter panel */}
      {showFilters && (
        <div className="border-b border-border bg-surface-card px-4 py-4">
          <div className="mx-auto flex max-w-[--container-max] flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                価格帯（1時間あたり）
              </p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {PRICE_BANDS.map((b) => (
                  <button
                    key={b.key}
                    onClick={() => setPriceBand(b.key)}
                    className={cn(
                      "flex-none rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                      priceBand === b.key
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border bg-surface text-on-surface-variant",
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  利用希望日
                </span>
                <DatePickerField
                  value={date}
                  onChange={setDate}
                  placeholder="日付を選択"
                  allowClear
                />
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setPriceBand("all");
                    setDate("");
                  }}
                  className="py-2 text-sm font-semibold text-primary hover:underline"
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[--container-max]">
        {/* Category pills */}
        <section className="mt-4 px-4">
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.value}
                icon={c.icon}
                active={category === c.value}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </section>

        {/* Feed */}
        <section className="mt-6 grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </section>

        {filtered.length === 0 && (
          <p className="mt-16 text-center text-on-surface-variant">
            条件に合うスペースが見つかりませんでした。
          </p>
        )}
      </main>

      <GuestNav />
    </div>
  );
}

function SpaceCard({ space }: { space: Space }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(space.id);
  return (
    <Link href={`/spaces/${space.id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-highest">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={space.images[0]}
          alt={space.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <button
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-card/80 backdrop-blur-sm transition hover:bg-surface-card",
            fav ? "text-error" : "text-on-surface",
          )}
          aria-label={fav ? "お気に入りから削除" : "お気に入りに追加"}
          aria-pressed={fav}
          onClick={(e) => {
            e.preventDefault();
            toggle(space.id);
          }}
        >
          <Icon name="favorite" filled={fav} className="text-[20px]" />
        </button>
        {space.rating >= 4.9 && (
          <span className="absolute left-3 top-3 rounded-full bg-on-surface/70 px-3 py-1 text-[11px] font-bold tracking-wide text-white backdrop-blur-sm">
            人気急上昇
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl leading-tight text-on-surface">
            {space.title}
          </h3>
          {space.rating > 0 && (
            <span className="mt-1 flex flex-none items-center gap-1 text-sm font-semibold text-on-surface">
              <Icon name="star" filled className="text-[16px] text-primary" />
              {space.rating.toFixed(1)}
              <span className="font-normal text-on-surface-variant">
                ({space.reviewCount})
              </span>
            </span>
          )}
        </div>
        <p className="text-sm text-on-surface-variant">{space.area}</p>
        <p className="text-xs text-on-surface-variant">
          {resourceCategoryLabel(space.resourceCategory)} ・{" "}
          {resourceTypeLabel(space.spaceType)} ・ 最大{space.capacity}
          {capacityUnitLabel(space.capacityUnit)}
        </p>
        <p className="mt-1 text-primary">
          <span className="text-lg font-bold">
            ¥{space.pricePerHour.toLocaleString()}
          </span>
          <span className="text-sm text-on-surface-variant"> / 時</span>
        </p>
      </div>
    </Link>
  );
}
