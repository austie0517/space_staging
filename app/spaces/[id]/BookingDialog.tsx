"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, cn } from "../../_components/ui";
import type { Availability } from "@/types";
import type { CalendarBooking } from "@/lib/mappers/booking";
import type { Space } from "@/lib/spaces";
import { createBookingAction } from "./actions";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 24; // 深夜0時クローズ（料金ポリシー準拠）
const START_OPTIONS = Array.from(
  { length: CLOSE_HOUR - OPEN_HOUR - 1 },
  (_, i) => OPEN_HOUR + i,
); // 09:00–22:00（最低1時間利用できるよう終了の1時間前まで）
const SERVICE_FEE_RATE = 0.1;

type Step = 1 | 2 | 3 | 4;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "日時" },
  { n: 2, label: "確認" },
  { n: 3, label: "支払い" },
  { n: 4, label: "完了" },
];

function fmtTime(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

function fmtDate(value: string) {
  if (!value) return "未選択";
  const d = dateFromYMD(value);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DOW[d.getDay()]}）`;
}

function hourFromHHMM(value: string) {
  return Number(value.slice(0, 2));
}

function availabilityFor(date: Date, rules: Availability[]): Availability | null {
  const ymd = ymdOf(date);
  const dow = date.getDay();
  for (const rule of rules) {
    if (rule.exceptions.includes(ymd)) continue;
    if (rule.bookableLevel === "closed") continue;
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
): CalendarBooking | null {
  return (
    bookings.find((booking) => {
      if (booking.ymd !== ymd || booking.status === "cancelled") return false;
      const bookedStart = hourFromHHMM(booking.start);
      const bookedEnd = hourFromHHMM(booking.end);
      return startHour < bookedEnd && endHour > bookedStart;
    }) ?? null
  );
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

export function BookingDialog({
  space,
  availabilities,
  bookings,
  open,
  onClose,
}: {
  space: Space;
  availabilities: Availability[];
  bookings: CalendarBooking[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [start, setStart] = useState(10);
  const [duration, setDuration] = useState(() => Math.max(1, space.minBookingHours));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const end = Math.min(CLOSE_HOUR, start + duration);
  const selectedRule = date ? availabilityFor(dateFromYMD(date), availabilities) : null;
  const selectedConflict = date
    ? bookingConflict(bookings, date, start, end)
    : null;

  // Lock body scroll while open. The parent remounts this dialog on each open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const hours = Math.max(0, end - start);
  const { usageFee, serviceFee, total } = useMemo(() => {
    const usage = space.pricePerHour * hours;
    const service = Math.round(usage * SERVICE_FEE_RATE);
    return { usageFee: usage, serviceFee: service, total: usage + service };
  }, [space.pricePerHour, hours]);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    const res = await createBookingAction({
      spaceId: space.id,
      date,
      startHour: start,
      endHour: end,
      guests,
      usageFee,
      serviceFee,
      total,
    });
    setSubmitting(false);
    if (res.ok) setStep(4);
    else setError(res.error);
  }

  if (!open) return null;

  const canProceed =
    date !== "" &&
    selectedRule !== null &&
    selectedConflict === null &&
    hours >= space.minBookingHours &&
    guests >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Scrim */}
      <button
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-surface-card shadow-[var(--shadow-soft)] sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-xl text-on-surface">予約リクエスト</h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-low"
          >
            <Icon name="close" />
          </button>
        </header>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 px-6 py-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    step >= s.n
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-high text-on-surface-variant/60",
                  )}
                >
                  {step > s.n ? <Icon name="check" className="text-[16px]" /> : s.n}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    step >= s.n ? "text-on-surface" : "text-on-surface-variant/60",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="h-px w-5 bg-border" />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {step === 1 && (
            <StepDateTime
              space={space}
              date={date}
              setDate={setDate}
              availabilities={availabilities}
              bookings={bookings}
              guests={guests}
              setGuests={setGuests}
              start={start}
              setStart={setStart}
              duration={duration}
              setDuration={setDuration}
              end={end}
              hours={hours}
              usageFee={usageFee}
              serviceFee={serviceFee}
              total={total}
          selectedRule={selectedRule}
          selectedConflict={selectedConflict}
            />
          )}
          {step === 2 && (
            <StepConfirm
              space={space}
              date={date}
              guests={guests}
              start={start}
              end={end}
              hours={hours}
              usageFee={usageFee}
              serviceFee={serviceFee}
              total={total}
            />
          )}
          {step === 3 && <StepPayment total={total} />}
          {step === 4 && <StepDone space={space} date={date} start={start} end={end} />}
        </div>

        {/* Footer actions */}
        <footer className="border-t border-border px-6 py-4">
          {step === 1 && (
            <Button
              fullWidth
              size="lg"
              disabled={!canProceed}
              onClick={() => setStep(2)}
            >
              予約内容を確認する
              <Icon name="arrow_forward" className="text-[20px]" />
            </Button>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-none whitespace-nowrap"
                onClick={() => setStep(1)}
              >
                戻る
              </Button>
              <Button size="lg" className="flex-1" onClick={() => setStep(3)}>
                支払いへ進む
                <Icon name="arrow_forward" className="text-[20px]" />
              </Button>
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-2">
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-error">
                  <Icon name="error" className="text-[18px]" />
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-none whitespace-nowrap"
                  disabled={submitting}
                  onClick={() => setStep(2)}
                >
                  確認へ戻る
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={submitting}
                  onClick={handleConfirm}
                >
                  {submitting
                    ? "処理中..."
                    : `¥${total.toLocaleString()} を支払う`}
                </Button>
              </div>
            </div>
          )}
          {step === 4 && (
            <Button
              fullWidth
              size="lg"
              onClick={() => {
                onClose();
                router.push("/guest/bookings");
              }}
            >
              予約履歴を見る
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Step 1 */

function StepDateTime(props: {
  space: Space;
  date: string;
  setDate: (v: string) => void;
  availabilities: Availability[];
  bookings: CalendarBooking[];
  guests: number;
  setGuests: (v: number) => void;
  start: number;
  setStart: (v: number) => void;
  duration: number;
  setDuration: (v: number) => void;
  end: number;
  hours: number;
  usageFee: number;
  serviceFee: number;
  total: number;
  selectedRule: Availability | null;
  selectedConflict: CalendarBooking | null;
}) {
  const {
    space, date, setDate, availabilities, bookings, guests, setGuests,
    start, setStart, duration, setDuration, end, hours, usageFee, serviceFee, total,
    selectedRule, selectedConflict,
  } = props;

  const [calendarMonth, setCalendarMonth] = useState(() => monthStart(new Date()));

  const availableStart = selectedRule ? hourFromHHMM(selectedRule.startTime) : OPEN_HOUR;
  const availableEnd = selectedRule ? hourFromHHMM(selectedRule.endTime) : CLOSE_HOUR;
  const minDuration = Math.max(1, space.minBookingHours);
  const startOptions = START_OPTIONS.filter(
    (h) => h >= availableStart && availableEnd - h >= minDuration,
  );
  const maxDuration = Math.max(minDuration, availableEnd - start); // keep end within available time
  const chooseStart = (h: number) => {
    setStart(h);
    if (duration > availableEnd - h) {
      setDuration(Math.max(minDuration, availableEnd - h));
    }
  };
  const chooseDate = (value: string) => {
    const rule = availabilityFor(dateFromYMD(value), availabilities);
    if (!rule) return;
    const ruleStart = hourFromHHMM(rule.startTime);
    const ruleEnd = hourFromHHMM(rule.endTime);
    if (ruleEnd - ruleStart < minDuration) return;
    setDate(value);
    if (start < ruleStart || start >= ruleEnd) {
      setStart(ruleStart);
      setDuration(Math.max(minDuration, Math.min(duration, ruleEnd - ruleStart)));
    } else if (duration > ruleEnd - start) {
      setDuration(Math.max(minDuration, ruleEnd - start));
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Date */}
      <Field label="日付">
        <MonthCalendar
          month={calendarMonth}
          selected={date}
          availabilities={availabilities}
          bookings={bookings}
          minBookingHours={space.minBookingHours}
          onMonthChange={setCalendarMonth}
          onSelect={chooseDate}
        />
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-low px-3 py-2 text-sm">
          <Icon name="event" className="text-[18px] text-primary" />
          <span className="text-on-surface-variant">選択日</span>
          <span className="font-semibold text-on-surface">{fmtDate(date)}</span>
        </div>
        {date && selectedRule && (
          <p className="mt-2 rounded-lg bg-success-container/60 px-3 py-2 text-sm text-on-surface">
            予約可能時間: {selectedRule.startTime} – {selectedRule.endTime}
            <span className="ml-2 text-on-surface-variant">
              最低{space.minBookingHours}時間
            </span>
          </p>
        )}
        {date && !selectedRule && (
          <p className="mt-2 rounded-lg bg-surface-low px-3 py-2 text-sm text-on-surface-variant">
            この日はスペースの受付可能日ではありません。
          </p>
        )}
        {selectedConflict && (
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-error-container px-3 py-2 text-sm text-error">
            <Icon name="block" className="mt-0.5 text-[18px]" />
            {selectedConflict.start}–{selectedConflict.end} はすでに予約があり、選択できません。
          </p>
        )}
      </Field>

      {/* Guests — large stepper */}
      <Field label="ゲスト数">
        <Stepper
          icon="group"
          value={guests}
          unit="名"
          min={1}
          max={space.capacity}
          onChange={setGuests}
        />
      </Field>

      {/* Start time — large tappable chips */}
      <Field label="開始時間">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {startOptions.length === 0 && (
            <p className="rounded-lg bg-surface-low px-3 py-2 text-sm text-on-surface-variant">
              日付を選ぶと開始時間を選択できます。
            </p>
          )}
          {startOptions.map((h) => {
            const active = start === h;
            const conflict = date
              ? bookingConflict(bookings, date, h, Math.min(availableEnd, h + duration))
              : null;
            return (
              <button
                key={h}
                type="button"
                disabled={conflict !== null}
                onClick={() => chooseStart(h)}
                className={cn(
                  "flex-none rounded-xl border px-4 py-3 text-[15px] font-semibold tabular-nums transition-all",
                  conflict
                    ? "cursor-not-allowed border-border bg-surface-low text-on-surface-variant/40"
                    : active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface text-on-surface active:bg-surface-low",
                )}
              >
                {fmtTime(h)}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Duration — stepper, end time derived */}
      <Field label="利用時間">
        <Stepper
          icon="schedule"
          value={duration}
          unit="時間"
          min={minDuration}
          max={maxDuration}
          onChange={setDuration}
          hint={`終了 ${fmtTime(end)}`}
        />
      </Field>

      {/* Price summary */}
      <div className="rounded-lg bg-surface-low p-4">
        <Row
          label={`利用料金（${hours}時間）`}
          value={`¥${usageFee.toLocaleString()}`}
        />
        <Row label="サービス手数料" value={`¥${serviceFee.toLocaleString()}`} />
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="font-semibold text-on-surface">合計</span>
          <span className="font-display text-2xl text-primary">
            ¥{total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function MonthCalendar({
  month,
  selected,
  availabilities,
  bookings,
  minBookingHours,
  onMonthChange,
  onSelect,
}: {
  month: Date;
  selected: string;
  availabilities: Availability[];
  bookings: CalendarBooking[];
  minBookingHours: number;
  onMonthChange: (month: Date) => void;
  onSelect: (value: string) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const weeks = useMemo(() => buildMonthCells(month), [month]);
  const monthLabel = `${month.getFullYear()}年${month.getMonth() + 1}月`;

  const moveMonth = (delta: number) => {
    const next = new Date(month);
    next.setMonth(month.getMonth() + delta, 1);
    onMonthChange(monthStart(next));
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-low"
          aria-label="前の月"
        >
          <Icon name="chevron_left" />
        </button>
        <p className="font-display text-base text-on-surface">{monthLabel}</p>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-low"
          aria-label="次の月"
        >
          <Icon name="chevron_right" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((dow, i) => (
          <div
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
          </div>
        ))}
        {weeks.map((cell) => {
          const value = ymdOf(cell.date);
          if (!cell.inMonth) {
            return <div key={value} className="aspect-square min-h-10" />;
          }
          const isSelected = selected === value;
          const isToday = ymdOf(today) === value;
          const isPast = cell.date < today;
          const rule = availabilityFor(cell.date, availabilities);
          const hasBooking = bookings.some(
            (b) => b.ymd === value && b.status !== "cancelled",
          );
          const selectable =
            !isPast &&
            rule !== null &&
            hasOpenSlot(bookings, value, rule, minBookingHours);
          return (
            <button
              key={value}
              type="button"
              disabled={!selectable}
              onClick={() => onSelect(value)}
              className={cn(
                "relative flex aspect-square min-h-10 items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors",
                !selectable && "cursor-not-allowed bg-surface-low text-on-surface-variant/30",
                selectable && !isSelected && "bg-primary-container/25 text-on-surface active:bg-primary-container/50",
                isToday && !isSelected && "ring-1 ring-primary-container",
                isSelected && "bg-primary text-on-primary",
              )}
            >
              {cell.date.getDate()}
              {hasBooking && selectable && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                    isSelected ? "bg-on-primary" : "bg-error",
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
    </div>
  );
}

/* --------------------------------------------------------- Step 3 */

function StepConfirm({
  space,
  date,
  guests,
  start,
  end,
  hours,
  usageFee,
  serviceFee,
  total,
}: {
  space: Space;
  date: string;
  guests: number;
  start: number;
  end: number;
  hours: number;
  usageFee: number;
  serviceFee: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-5 py-2">
      <div>
        <p className="text-sm font-semibold text-primary">予約内容の確認</p>
        <h3 className="mt-1 font-display text-2xl leading-tight text-on-surface">
          {space.title}
        </h3>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <Row label="日付" value={fmtDate(date)} />
        <Row label="時間" value={`${fmtTime(start)} – ${fmtTime(end)}（${hours}時間）`} />
        <Row label="ゲスト数" value={`${guests}名`} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <Row label={`利用料金（${hours}時間）`} value={`¥${usageFee.toLocaleString()}`} />
        <Row label="サービス手数料" value={`¥${serviceFee.toLocaleString()}`} />
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold text-on-surface">合計</span>
          <span className="font-display text-2xl text-primary">
            ¥{total.toLocaleString()}
          </span>
        </div>
      </div>

      <p className="rounded-lg bg-primary-container/20 p-3 text-sm leading-relaxed text-on-surface-variant">
        この内容で支払い確認へ進みます。日時や人数を変更する場合は戻って修正してください。
      </p>
    </div>
  );
}

/* --------------------------------------------------------- Step 2 */

function StepPayment({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-5 py-2">
      <p className="font-semibold text-on-surface">お支払い情報</p>
      <Field label="カード番号">
        <input
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="有効期限">
          <input
            placeholder="MM / YY"
            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
          />
        </Field>
        <Field label="セキュリティコード">
          <input
            placeholder="CVC"
            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
          />
        </Field>
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-primary-container/20 p-3 text-sm text-on-surface-variant">
        <Icon name="lock" className="text-[18px] text-primary" />
        <p>
          すべての予約は前払いです。¥{total.toLocaleString()} を Stripe
          で安全に決済します（デモUI）。
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Step 3 */

function StepDone({
  space,
  date,
  start,
  end,
}: {
  space: Space;
  date: string;
  start: number;
  end: number;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-container">
        <Icon name="check" filled className="text-[32px] text-success" />
      </span>
      <h3 className="font-display text-2xl text-on-surface">予約リクエスト完了</h3>
      <p className="max-w-xs text-sm text-on-surface-variant">
        {space.title} へのリクエストを送信しました。ホストの承認後、確定通知が届きます。
      </p>
      <div className="w-full rounded-lg bg-surface-low p-4 text-left text-sm">
        <Row label="スペース" value={space.title} />
        <Row label="日付" value={date || "—"} />
        <Row label="時間" value={`${fmtTime(start)} – ${fmtTime(end)}`} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------- helpers */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Large +/- stepper — 44px touch targets, comfortable on iPhone. */
function Stepper({
  icon,
  value,
  unit,
  min,
  max,
  onChange,
  hint,
}: {
  icon: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  const round = "flex h-11 w-11 flex-none items-center justify-center rounded-full border border-border bg-surface text-on-surface transition-colors active:bg-surface-low disabled:opacity-30";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5">
      <span className="flex items-center gap-2 text-on-surface-variant">
        <Icon name={icon} className="text-[20px] text-primary" />
        {hint && <span className="text-sm">{hint}</span>}
      </span>
      <div className="flex items-center gap-4">
        <button type="button" onClick={dec} disabled={value <= min} className={round} aria-label="減らす">
          <Icon name="remove" />
        </button>
        <span className="w-16 text-center text-lg font-bold tabular-nums text-on-surface">
          {value}
          <span className="ml-0.5 text-sm font-normal text-on-surface-variant">{unit}</span>
        </span>
        <button type="button" onClick={inc} disabled={value >= max} className={round} aria-label="増やす">
          <Icon name="add" />
        </button>
      </div>
    </div>
  );
}

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateFromYMD(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function ymdOf(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function buildMonthCells(month: Date): { date: Date; inMonth: boolean }[] {
  const first = monthStart(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    date.setHours(0, 0, 0, 0);
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-semibold text-on-surface">{value}</span>
    </div>
  );
}
