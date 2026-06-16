"use client";

import { useMemo, useState } from "react";
import { Badge, Icon, cn } from "../../../_components/ui";
import type { Availability } from "@/types";
import type { CalendarBooking } from "@/lib/mappers/booking";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTHS = "1月2月3月4月5月6月7月8月9月10月11月12月".match(/\d+月/g)!;

const pad = (n: number) => String(n).padStart(2, "0");
const ymdOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const initialCalendarState = () => {
  const d = new Date();
  const today = ymdOf(d);
  return {
    view: { y: d.getFullYear(), m: d.getMonth() },
    today,
    selected: today,
  };
};

/** Does any availability rule cover this date? */
function availabilityFor(d: Date, rules: Availability[]): Availability | null {
  const ymd = ymdOf(d);
  for (const r of rules) {
    if (r.exceptions.includes(ymd)) continue;
    if (r.repeatUntil && ymd > r.repeatUntil) continue;
    const dow = d.getDay();
    if (r.repeatType === "daily") return r;
    if (r.repeatType === "monthly") return r;
    if (r.repeatType === "weekly" && r.daysOfWeek.includes(dow)) return r;
  }
  return null;
}

/**
 * Per-space month calendar. Shows the current month (navigable), highlights
 * today, marks days with bookings, tints days covered by an availability rule,
 * and lists the selected day's schedule.
 */
export function SpaceCalendar({
  bookings,
  availabilities,
}: {
  bookings: CalendarBooking[];
  availabilities: Availability[];
}) {
  const [{ view, today, selected }, setCalendar] = useState(initialCalendarState);

  // Active bookings grouped by day.
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      (map.get(b.ymd) ?? map.set(b.ymd, []).get(b.ymd)!).push(b);
    }
    return map;
  }, [bookings]);

  const first = new Date(view.y, view.m, 1);
  const offset = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const move = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setCalendar((current) => ({
      ...current,
      view: { y: d.getFullYear(), m: d.getMonth() },
    }));
  };

  const selDate = new Date(selected + "T00:00:00");
  const selRule = availabilityFor(selDate, availabilities);
  const selBookings = byDay.get(selected) ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Month grid */}
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-2xl text-on-surface">
            {view.y}年{MONTHS[view.m]}
          </p>
          <div className="flex gap-1">
            <IconBtn name="chevron_left" onClick={() => move(-1)} />
            <IconBtn name="chevron_right" onClick={() => move(1)} />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <span
              key={d}
              className={cn(
                "py-1 text-xs font-bold",
                i === 0 ? "text-error" : "text-on-surface-variant",
              )}
            >
              {d}
            </span>
          ))}
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const date = new Date(view.y, view.m, day);
            const ymd = ymdOf(date);
            const isToday = ymd === today;
            const isSel = ymd === selected;
            const hasBooking = byDay.has(ymd);
            const open = availabilityFor(date, availabilities) !== null;
            return (
              <button
                key={day}
                onClick={() =>
                  setCalendar((current) => ({ ...current, selected: ymd }))
                }
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors",
                  isSel && open
                    ? "bg-primary font-bold text-on-primary"
                    : isSel
                      ? "bg-surface-high font-bold text-on-surface-variant ring-2 ring-border ring-inset"
                    : open
                      ? "bg-primary-container/30 text-on-surface hover:bg-primary-container/50"
                      : "bg-surface-low text-on-surface-variant/35 hover:bg-surface-high",
                  isToday && !isSel && "ring-2 ring-primary ring-inset font-bold",
                )}
              >
                {day}
                {hasBooking && (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1 w-1 rounded-full",
                      isSel ? "bg-on-primary" : "bg-primary",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-primary-container/50" /> 受付可
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-surface-low" /> 受付不可
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> 予約あり
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded ring-2 ring-primary ring-inset" /> 今日
          </span>
        </div>
      </div>

      {/* Day detail */}
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-on-surface">
            {selDate.getMonth() + 1}月{selDate.getDate()}日 の予定
          </h3>
          <Badge tone={selRule ? "success" : "neutral"}>
            {selRule ? "予約受付中" : "受付なし"}
          </Badge>
        </div>

        <div className="mt-4 rounded-lg bg-surface-low p-4">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            利用可能時間
          </p>
          <p className="mt-1 font-display text-2xl text-on-surface">
            {selRule ? `${selRule.startTime} – ${selRule.endTime}` : "—"}
          </p>
        </div>

        <h4 className="mb-2 mt-5 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
          当日の予約（{selBookings.length}）
        </h4>
        {selBookings.length === 0 ? (
          <p className="rounded-lg bg-surface-low p-4 text-sm text-on-surface-variant">
            予約はありません。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {selBookings.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {b.guestName}様
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {b.start}–{b.end}
                  </p>
                </div>
                <Badge tone={b.status === "confirmed" ? "primary" : "warning"}>
                  {b.status === "confirmed" ? "確定" : "承認待ち"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-low"
    >
      <Icon name={name} />
    </button>
  );
}
