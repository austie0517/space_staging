"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, cn } from "../../../_components/ui";
import {
  DatePickerField,
  formatDateLabel,
} from "../../../_components/DatePickerField";
import {
  repeatTypeLabel,
  WEEKDAY_LABELS,
  type Availability,
  type RepeatType,
} from "@/lib/sampleData";
import {
  addAvailabilityAction,
  deleteAvailabilityAction,
  updateAvailabilityAction,
  type ActionResult,
} from "./actions";

const HOURS = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const BOOKABLE_LEVEL_LABEL: Record<Availability["bookableLevel"], string> = {
  seat: "席貸し",
  space: "全体貸し",
  both: "両方",
  closed: "休業",
};

type RuleDraft = Omit<Availability, "id" | "spaceId">;

/**
 * Host editor for recurring availability rules (availabilities table).
 * Existing rules can be edited in place; date inputs use a large tap-friendly
 * calendar sheet instead of native date pickers.
 */
export function AvailabilityEditor({
  spaceId,
  initial,
}: {
  spaceId: string;
  initial: Availability[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = () => startTransition(() => router.refresh());

  const add = async (draft: RuleDraft) => {
    const res = await addAvailabilityAction({ spaceId, ...draft });
    if (res.ok) {
      setAdding(false);
      refresh();
    }
    return res;
  };

  const update = async (id: string, draft: RuleDraft) => {
    const res = await updateAvailabilityAction({ id, spaceId, ...draft });
    if (res.ok) {
      setEditingId(null);
      refresh();
    }
    return res;
  };

  const remove = async (id: string) => {
    if (!confirm("この空き枠ルールを削除しますか？")) return;
    const res = await deleteAvailabilityAction(id, spaceId);
    if (res.ok) refresh();
  };

  return (
    <div className="rounded-xl border border-border bg-surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-on-surface">空き枠ルール</h3>
          <p className="text-sm text-on-surface-variant">
            時間枠と繰り返しを設定して空き状況を一括管理します。
          </p>
        </div>
        <Button
          size="sm"
          className="flex-none whitespace-nowrap"
          onClick={() => {
            setEditingId(null);
            setAdding((v) => !v);
          }}
        >
          <Icon name={adding ? "close" : "add"} className="text-[18px]" />
          {adding ? "閉じる" : "追加"}
        </Button>
      </div>

      {adding && (
        <RuleForm
          mode="add"
          onCancel={() => setAdding(false)}
          onSubmit={add}
        />
      )}

      <ul className={cn("mt-4 flex flex-col gap-2", pending && "opacity-60")}>
        {initial.length === 0 && (
          <li className="rounded-lg bg-surface-low p-4 text-sm text-on-surface-variant">
            まだルールがありません。「追加」から登録してください。
          </li>
        )}
        {initial.map((rule) => (
          <li key={rule.id} className="rounded-lg border border-border bg-surface p-4">
            {editingId === rule.id ? (
              <RuleForm
                mode="edit"
                initial={rule}
                onCancel={() => setEditingId(null)}
                onSubmit={(draft) => update(rule.id, draft)}
              />
            ) : (
              <RuleSummary
                rule={rule}
                onEdit={() => {
                  setAdding(false);
                  setEditingId(rule.id);
                }}
                onDelete={() => remove(rule.id)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RuleSummary({
  rule,
  onEdit,
  onDelete,
}: {
  rule: Availability;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg text-on-surface">
            {rule.startTime} – {rule.endTime}
          </span>
          <Badge tone="neutral">{BOOKABLE_LEVEL_LABEL[rule.bookableLevel]}</Badge>
          <Badge tone="primary">{repeatTypeLabel[rule.repeatType]}</Badge>
        </div>

        {rule.repeatType === "weekly" && rule.daysOfWeek.length > 0 && (
          <div className="mt-2 flex gap-1">
            {WEEKDAY_LABELS.map((day, i) => (
              <span
                key={day}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  rule.daysOfWeek.includes(i)
                    ? "bg-primary font-bold text-on-primary"
                    : "bg-surface-low text-on-surface-variant/50",
                )}
              >
                {day}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-col gap-0.5 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="event" className="text-[15px]" />
            {rule.repeatUntil ? `${formatDateLabel(rule.repeatUntil)} まで` : "無期限"}
          </span>
          {rule.exceptions.length > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="event_busy" className="text-[15px]" />
              除外日 {rule.exceptions.length}件（{rule.exceptions.map(formatDateLabel).join("、")}）
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-none items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="編集"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-container/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <Icon name="edit" className="text-[20px]" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="削除"
          className="flex h-9 w-9 items-center justify-center rounded-full text-error transition-colors hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30"
        >
          <Icon name="delete" className="text-[20px]" />
        </button>
      </div>
    </div>
  );
}

function RuleForm({
  mode,
  initial,
  onCancel,
  onSubmit,
}: {
  mode: "add" | "edit";
  initial?: Availability;
  onCancel: () => void;
  onSubmit: (draft: RuleDraft) => Promise<ActionResult>;
}) {
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "21:00");
  const [bookableLevel, setBookableLevel] = useState<Availability["bookableLevel"]>(
    initial?.bookableLevel ?? "both",
  );
  const [repeatType, setRepeatType] = useState<RepeatType>(
    initial?.repeatType ?? "weekly",
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initial?.daysOfWeek.length ? initial.daysOfWeek : [1, 2, 3, 4, 5],
  );
  const [repeatUntil, setRepeatUntil] = useState(initial?.repeatUntil ?? "");
  const [exceptions, setExceptions] = useState<string[]>(initial?.exceptions ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repeatTypes: RepeatType[] = ["none", "daily", "weekly", "monthly"];
  const valid = startTime < endTime;

  const toggleDay = (i: number) =>
    setDaysOfWeek((prev) =>
      prev.includes(i) ? prev.filter((day) => day !== i) : [...prev, i].sort(),
    );

  const addException = (ymd: string) => {
    setExceptions((prev) => (prev.includes(ymd) ? prev : [...prev, ymd].sort()));
  };

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const res = await onSubmit({
      bookableLevel,
      startTime,
      endTime,
      repeatType,
      repeatUntil: repeatUntil || undefined,
      daysOfWeek: repeatType === "weekly" ? daysOfWeek : [],
      exceptions,
    });
    setSaving(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        mode === "add" && "mt-4 rounded-lg border border-dashed border-border bg-surface-low p-4",
      )}
    >
      <div className="grid grid-cols-2 gap-3">
        <Labeled label="開始">
          <TimeSelect value={startTime} onChange={setStartTime} />
        </Labeled>
        <Labeled label="終了">
          <TimeSelect value={endTime} onChange={setEndTime} />
        </Labeled>
      </div>
      {!valid && (
        <p className="text-sm text-error">終了は開始より後の時刻にしてください。</p>
      )}

      <Labeled label="予約タイプ">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(BOOKABLE_LEVEL_LABEL) as Availability["bookableLevel"][]).map(
            (level) => (
              <button
                key={level}
                type="button"
                onClick={() => setBookableLevel(level)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                  bookableLevel === level
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface text-on-surface",
                )}
              >
                {BOOKABLE_LEVEL_LABEL[level]}
              </button>
            ),
          )}
        </div>
      </Labeled>

      <Labeled label="繰り返し">
        <div className="flex flex-wrap gap-2">
          {repeatTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRepeatType(type)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                repeatType === type
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-on-surface",
              )}
            >
              {repeatTypeLabel[type]}
            </button>
          ))}
        </div>
      </Labeled>

      {repeatType === "weekly" && (
        <Labeled label="曜日">
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((day, i) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(i)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  daysOfWeek.includes(i)
                    ? "bg-primary text-on-primary"
                    : "border border-border bg-surface text-on-surface-variant",
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </Labeled>
      )}

      {repeatType !== "none" && (
        <Labeled label="終了日（空欄で無期限）">
          <DatePickerField
            value={repeatUntil}
            onChange={setRepeatUntil}
            placeholder="無期限"
            allowClear
          />
        </Labeled>
      )}

      <Labeled label="除外日">
        <DatePickerField
          value=""
          onChange={addException}
          placeholder="除外日を選択"
        />
        {exceptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {exceptions.map((date) => (
              <span
                key={date}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-sm text-on-surface"
              >
                {formatDateLabel(date)}
                <button
                  type="button"
                  onClick={() =>
                    setExceptions((prev) => prev.filter((x) => x !== date))
                  }
                  aria-label="除外日を削除"
                >
                  <Icon name="close" className="text-[16px] text-on-surface-variant" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Labeled>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-error">
          <Icon name="error" className="text-[18px]" />
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
          キャンセル
        </Button>
        <Button size="sm" disabled={!valid || saving} onClick={submit}>
          {saving ? "保存中..." : mode === "edit" ? "更新する" : "ルールを保存"}
        </Button>
      </div>
    </div>
  );
}

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-[15px] outline-none focus:border-primary"
    >
      {HOURS.map((hour) => (
        <option key={hour} value={hour}>
          {hour}
        </option>
      ))}
    </select>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </div>
  );
}
