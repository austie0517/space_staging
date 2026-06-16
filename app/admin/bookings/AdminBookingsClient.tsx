"use client";

import { useState } from "react";
import { Badge, Button, Icon, Toast, cn } from "../../_components/ui";
import { AdminShell } from "../AdminShell";
import { statusLabel } from "@/mock";
import type { Booking, BookingStatus } from "@/types";
import { adminCancelBookingAction, adminRefundBookingAction } from "./actions";

type Filter = "all" | "pending" | "confirmed" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "pending", label: "承認待ち" },
  { key: "confirmed", label: "確定" },
  { key: "cancelled", label: "キャンセル" },
];

type Action = { booking: Booking; type: "cancel" | "refund" };

export function AdminBookingsClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [refunded, setRefunded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [acting, setActing] = useState<Action | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const visible =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  };

  const confirm = async () => {
    if (!acting) return;
    const { booking, type } = acting;
    // Optimistic local update; the action persists + revalidates.
    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id ? { ...b, status: "cancelled" as BookingStatus } : b,
      ),
    );
    setActing(null);
    const res =
      type === "refund"
        ? await adminRefundBookingAction(booking.id)
        : await adminCancelBookingAction(booking.id);
    if (!res.ok) {
      flash(res.error);
      return;
    }
    if (type === "refund") {
      setRefunded((prev) => new Set(prev).add(booking.id));
      flash("返金処理を記録しました");
    } else {
      flash("予約をキャンセルしました");
    }
  };

  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
          全予約（{visible.length}）
        </h2>
      </div>

      {/* Status filter */}
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? bookings.length
              : bookings.filter((b) => b.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex-none rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                filter === f.key
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface-card text-on-surface-variant",
              )}
            >
              {f.label}（{count}）
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-on-surface-variant">
            この状態の予約はありません。
          </p>
        )}
        {visible.map((b) => {
          const isRefunded = refunded.has(b.id);
          const actionable = b.status === "pending" || b.status === "confirmed";
          return (
            <div
              key={b.id}
              className="rounded-xl border border-border bg-surface-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-on-surface">
                    {b.spaceTitle}
                    <span className="ml-2 text-xs font-normal text-on-surface-variant">
                      #{b.code}
                    </span>
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {b.guestName}・{b.date} {b.start}–{b.end}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-on-surface">
                    ¥{b.total.toLocaleString()}
                  </p>
                  <Badge
                    tone={
                      b.status === "confirmed"
                        ? "primary"
                        : b.status === "pending"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {isRefunded ? "返金済" : statusLabel[b.status]}
                  </Badge>
                </div>
              </div>

              {/* Operations */}
              {actionable && (
                <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                  {b.status === "confirmed" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActing({ booking: b, type: "refund" })}
                    >
                      <Icon name="currency_yen" className="text-[16px]" /> 返金
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setActing({ booking: b, type: "cancel" })}
                  >
                    <Icon name="cancel" className="text-[16px]" /> キャンセル
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {acting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            aria-label="閉じる"
            onClick={() => setActing(null)}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-surface-card p-6 shadow-[var(--shadow-soft)] sm:rounded-2xl">
            <h3 className="font-display text-xl text-on-surface">
              {acting.type === "refund" ? "返金しますか？" : "予約をキャンセルしますか？"}
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              {acting.booking.spaceTitle}・#{acting.booking.code}（
              {acting.booking.guestName}）
              {acting.type === "refund"
                ? `に ¥${acting.booking.total.toLocaleString()} を返金し、予約をキャンセルします。`
                : "をキャンセルします。"}
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setActing(null)}
              >
                戻る
              </Button>
              <Button variant="danger" size="md" fullWidth onClick={confirm}>
                {acting.type === "refund" ? "返金する" : "キャンセルする"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast show={toast !== null} message={toast ?? ""} />
    </AdminShell>
  );
}
