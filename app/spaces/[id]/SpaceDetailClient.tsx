"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Availability, Review, Space, SpaceField } from "@/types";
import type { CalendarBooking } from "@/lib/mappers/booking";
import { formatFieldValue } from "@/mock";
import { amenityIcon } from "@/lib/amenityIcon";
import { Button, Icon, Stars, cn } from "../../_components/ui";
import { useFavorites } from "../../_components/useFavorites";
import { BookingDialog } from "./BookingDialog";
import {
  capacityUnitLabel,
  resourceCategoryLabel,
  resourceTypeLabel,
} from "@/lib/resourceClassification";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymdOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const dateFromYMD = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const hourFromHHMM = (value: string) => Number(value.slice(0, 2));

function availabilityFor(date: Date, rules: Availability[]): Availability | null {
  const ymd = ymdOf(date);
  const dow = date.getDay();
  for (const rule of rules) {
    if (rule.exceptions.includes(ymd)) continue;
    if (rule.repeatUntil && ymd > rule.repeatUntil) continue;
    if (rule.repeatType === "daily") return rule;
    if (rule.repeatType === "monthly") return rule;
    if (rule.repeatType === "weekly" && rule.daysOfWeek.includes(dow)) {
      return rule;
    }
  }
  return null;
}

function bookingConflict(
  bookings: CalendarBooking[],
  ymd: string,
  startHour: number,
  endHour: number,
) {
  return bookings.some((booking) => {
    if (booking.ymd !== ymd || booking.status === "cancelled") return false;
    const bookedStart = hourFromHHMM(booking.start);
    const bookedEnd = hourFromHHMM(booking.end);
    return startHour < bookedEnd && endHour > bookedStart;
  });
}

function hasOpenSlot(
  bookings: CalendarBooking[],
  ymd: string,
  rule: Availability,
  minBookingHours: number,
) {
  const start = hourFromHHMM(rule.startTime);
  const end = hourFromHHMM(rule.endTime);
  for (let h = start; h + minBookingHours <= end; h += 1) {
    if (!bookingConflict(bookings, ymd, h, h + minBookingHours)) return true;
  }
  return false;
}

function buildMonthCells(month: Date) {
  const first = monthStart(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return {
      date,
      inMonth: date.getMonth() === month.getMonth(),
    };
  });
}

export function SpaceDetailClient({
  space,
  reviews,
  fields,
  availabilities,
  bookings,
  canRequestBooking,
}: {
  space: Space;
  reviews: Review[];
  fields: SpaceField[];
  availabilities: Availability[];
  bookings: CalendarBooking[];
  canRequestBooking: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasPitch = Boolean(space.pitchTitle || space.pitchBody);

  return (
    <div className="min-h-full pb-28">
      {/* Hero */}
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[21/9]">
        <Image
          src={space.images[0]}
          alt={space.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/70 via-transparent to-on-surface/10" />

        <Link
          href="/spaces"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-card/80 text-on-surface backdrop-blur-sm"
          aria-label="戻る"
        >
          <Icon name="arrow_back" />
        </Link>

        <FavoriteButton spaceId={space.id} />

        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          {space.rating > 0 && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
              <Icon name="star" filled className="text-[16px]" />
              {space.rating.toFixed(1)}
              <span className="font-normal">（{space.reviewCount}件）</span>
            </span>
          )}
          <h1 className="font-display text-3xl leading-tight">{space.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-white/90">
            <Icon name="location_on" className="text-[18px]" />
            {space.area}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-5">
        {/* About */}
        <section className="py-7">
          <h2 className="font-display text-2xl text-on-surface">スペースについて</h2>
          {hasPitch ? (
            <div className="mt-3">
              {space.pitchTitle && (
                <h3 className="font-display text-xl leading-snug text-on-surface">
                  {space.pitchTitle}
                </h3>
              )}
              {space.pitchBody && (
                <p className="mt-3 whitespace-pre-line leading-relaxed text-on-surface-variant">
                  {space.pitchBody}
                </p>
              )}
              {space.description && (
                <p className="mt-4 border-l-2 border-primary-container pl-4 text-sm leading-relaxed text-on-surface-variant">
                  {space.description}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 leading-relaxed text-on-surface-variant">
              {space.description || "このスペースの紹介文はまだありません。"}
            </p>
          )}

          {/* Quick facts */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Fact
              icon="group"
              label="最大収容"
              value={`${space.capacity}${capacityUnitLabel(space.capacityUnit)}`}
            />
            <Fact icon="wifi" label="Wi-Fi" value={space.wifi ? "完備" : "なし"} />
            <Fact
              icon="local_parking"
              label="駐車場"
              value={space.parking ? "あり" : "なし"}
            />
            <Fact
              icon="sell"
              label="カテゴリ"
              value={resourceCategoryLabel(space.resourceCategory)}
            />
            <Fact
              icon="category"
              label="予約タイプ"
              value={resourceTypeLabel(space.spaceType)}
            />
          </div>
        </section>

        {/* Amenities */}
        {space.amenities.length > 0 && (
          <section className="border-t border-border py-7">
            <h2 className="font-display text-2xl text-on-surface">設備・備品</h2>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {space.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2.5 text-on-surface">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-container/30">
                    <Icon name={amenityIcon(a)} className="text-[20px] text-primary" />
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Detail fields — DB-managed, public-only (space_fields) */}
        <SpaceFieldsSection fields={fields} />

        {/* Availability note */}
        <section className="border-t border-border py-7">
          <h2 className="font-display text-2xl text-on-surface">予約空き状況</h2>
          <GuestAvailabilityCalendar
            minBookingHours={space.minBookingHours}
            availabilities={availabilities}
            bookings={bookings}
          />
        </section>

        {/* Reviews */}
        <ReviewsSection space={space} reviews={reviews} />
      </main>

      {/* Sticky booking bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-3">
          <div>
            <p className="font-display text-2xl text-primary">
              ¥{space.pricePerHour.toLocaleString()}
              <span className="text-sm font-normal text-on-surface-variant">
                {" "}
                / 時
              </span>
            </p>
            <p className="text-xs text-on-surface-variant">
              {canRequestBooking
                ? "前払い・即時確保"
                : "予約には本人確認が必要です"}
            </p>
          </div>
          {canRequestBooking ? (
            <Button size="lg" onClick={() => setDialogOpen(true)}>
              予約申請に進む
              <Icon name="arrow_forward" className="text-[20px]" />
            </Button>
          ) : (
            <ButtonLinkLike href="/me/verify" />
          )}
        </div>
      </div>

      {dialogOpen && (
        <BookingDialog
          space={space}
          availabilities={availabilities}
          bookings={bookings}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}

function ButtonLinkLike({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-on-primary shadow-[var(--shadow-soft)] transition-all duration-200 hover:brightness-110 active:brightness-95"
    >
      本人確認へ
      <Icon name="verified_user" className="text-[20px]" />
    </Link>
  );
}

function GuestAvailabilityCalendar({
  minBookingHours,
  availabilities,
  bookings,
}: {
  minBookingHours: number;
  availabilities: Availability[];
  bookings: CalendarBooking[];
}) {
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selected, setSelected] = useState(() => ymdOf(new Date()));
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const cells = useMemo(() => buildMonthCells(month), [month]);
  const selectedDate = dateFromYMD(selected);
  const selectedRule = availabilityFor(selectedDate, availabilities);
  const selectedHasSlot =
    selectedRule !== null &&
    selectedDate >= today &&
    hasOpenSlot(bookings, selected, selectedRule, minBookingHours);

  const moveMonth = (delta: number) => {
    const next = new Date(month);
    next.setMonth(month.getMonth() + delta, 1);
    setMonth(monthStart(next));
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          aria-label="前の月"
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-low"
        >
          <Icon name="chevron_left" />
        </button>
        <p className="font-display text-lg text-on-surface">
          {month.getFullYear()}年{month.getMonth() + 1}月
        </p>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          aria-label="次の月"
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-low"
        >
          <Icon name="chevron_right" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((dow, i) => (
          <span
            key={dow}
            className={cn(
              "py-1 text-[11px] font-semibold",
              i === 0
                ? "text-error"
                : i === 6
                  ? "text-primary"
                  : "text-on-surface-variant",
            )}
          >
            {dow}
          </span>
        ))}
        {cells.map((cell) => {
          const value = ymdOf(cell.date);
          if (!cell.inMonth) {
            return <span key={value} className="aspect-square min-h-10" />;
          }
          const rule = availabilityFor(cell.date, availabilities);
          const isPast = cell.date < today;
          const isSelected = selected === value;
          const hasBooking = bookings.some(
            (booking) => booking.ymd === value && booking.status !== "cancelled",
          );
          const selectable =
            !isPast &&
            rule !== null &&
            hasOpenSlot(bookings, value, rule, minBookingHours);

          return (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className={cn(
                "relative flex aspect-square min-h-10 items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors",
                selectable && !isSelected && "bg-primary-container/25 text-on-surface active:bg-primary-container/50",
                !selectable && !isSelected && "bg-surface-low text-on-surface-variant/30",
                isSelected && selectable && "bg-primary text-on-primary",
                isSelected &&
                  !selectable &&
                  "bg-surface-high text-on-surface-variant ring-2 ring-border ring-inset",
              )}
            >
              {cell.date.getDate()}
              {hasBooking && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                    isSelected && selectable ? "bg-on-primary" : "bg-error",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-primary-container/50" />
          選択可
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-surface-low" />
          受付不可
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-error" />
          予約あり
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-surface-low p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          選択日の受付時間
        </p>
        <p className="mt-1 font-display text-xl text-on-surface">
          {selectedHasSlot && selectedRule
            ? `${selectedRule.startTime} – ${selectedRule.endTime}`
            : "受付不可"}
        </p>
      </div>
    </div>
  );
}

function FavoriteButton({ spaceId }: { spaceId: string }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(spaceId);
  return (
    <button
      onClick={() => toggle(spaceId)}
      aria-label={fav ? "お気に入りから削除" : "お気に入りに追加"}
      aria-pressed={fav}
      className={cn(
        "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-card/80 backdrop-blur-sm transition-colors",
        fav ? "text-error" : "text-on-surface",
      )}
    >
      <Icon name="favorite" filled={fav} />
    </button>
  );
}

function SpaceFieldsSection({ fields }: { fields: SpaceField[] }) {
  if (fields.length === 0) return null;

  return (
    <section className="border-t border-border py-7">
      <h2 className="font-display text-2xl text-on-surface">詳細情報</h2>
      <dl className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface-card">
        {fields.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <dt className="text-sm text-on-surface-variant">{f.label}</dt>
            <dd className="text-right font-semibold text-on-surface">
              {formatFieldValue(f)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ReviewsSection({
  space,
  reviews,
}: {
  space: Space;
  reviews: Review[];
}) {
  return (
    <section className="border-t border-border py-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-on-surface">レビュー</h2>
        {space.rating > 0 && (
          <span className="flex items-center gap-2">
            <Stars value={space.rating} size={18} />
            <span className="font-semibold text-on-surface">
              {space.rating.toFixed(1)}
            </span>
            <span className="text-sm text-on-surface-variant">
              （{space.reviewCount}件）
            </span>
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4 rounded-lg bg-surface-low p-4 text-sm text-on-surface-variant">
          まだレビューはありません。最初のゲストになりましょう。
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-5">
          {reviews.map((r) => (
            <li key={r.id} className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.authorAvatar}
                alt={r.authorName}
                className="h-10 w-10 flex-none rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-on-surface">{r.authorName}</p>
                  <span className="text-xs text-on-surface-variant">
                    {r.createdAt}
                  </span>
                </div>
                <Stars value={r.rating} size={14} className="my-1" />
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {r.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-card p-3">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-container/30">
        <Icon name={icon} className="text-[20px] text-primary" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="truncate font-semibold text-on-surface">{value}</p>
      </div>
    </div>
  );
}
