"use client";

import { useMemo, useState } from "react";
import { Button, Icon, cn } from "./ui";
import { WEEKDAY_LABELS } from "@/lib/sampleData";

const MONTH_LABELS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYMD = (ymd?: string) => {
  if (!ymd) return new Date();
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatDateLabel = (ymd: string) => ymd.replaceAll("-", "/");

export function DatePickerField({
  value,
  onChange,
  placeholder,
  allowClear,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-11 flex-1 items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-left text-[15px] outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <span className={value ? "text-on-surface" : "text-on-surface-variant"}>
            {value ? formatDateLabel(value) : placeholder}
          </span>
          <Icon name="calendar_month" className="text-[20px] text-primary" />
        </button>
        {allowClear && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="日付をクリア"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-on-surface-variant"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        )}
      </div>
      {open && (
        <CalendarSheet
          selected={value}
          onClose={() => setOpen(false)}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function CalendarSheet({
  selected,
  onSelect,
  onClose,
}: {
  selected: string;
  onSelect: (ymd: string) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(() => {
    const base = fromYMD(selected);
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [month]);

  const moveMonth = (diff: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + diff, 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface-card p-4 shadow-soft sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="前の月"
            className="flex h-11 w-11 items-center justify-center rounded-full text-primary hover:bg-primary-container/20"
          >
            <Icon name="chevron_left" />
          </button>
          <p className="font-display text-xl text-on-surface">
            {month.getFullYear()}年 {MONTH_LABELS[month.getMonth()]}
          </p>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="次の月"
            className="flex h-11 w-11 items-center justify-center rounded-full text-primary hover:bg-primary-container/20"
          >
            <Icon name="chevron_right" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-on-surface-variant">
          {WEEKDAY_LABELS.map((day) => (
            <span key={day} className="py-2">
              {day}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const ymd = toYMD(day);
            const inMonth = day.getMonth() === month.getMonth();
            const isSelected = ymd === selected;
            return (
              <button
                key={ymd}
                type="button"
                onClick={() => onSelect(ymd)}
                className={cn(
                  "flex aspect-square min-h-10 items-center justify-center rounded-full text-sm font-semibold transition",
                  isSelected
                    ? "bg-primary text-on-primary"
                    : inMonth
                      ? "text-on-surface hover:bg-primary-container/20"
                      : "text-on-surface-variant/35",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
