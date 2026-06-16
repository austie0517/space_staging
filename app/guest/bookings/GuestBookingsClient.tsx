"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, ButtonLink, Icon } from "../../_components/ui";
import { GuestNav } from "../../_components/GuestNav";
import { ReviewDialog } from "./ReviewDialog";
import { cancelBookingAction, submitReviewAction } from "./actions";
import { statusLabel } from "@/mock";
import type { Booking, BookingStatus } from "@/types";

export function GuestBookingsClient({
  initialBookings,
  reviewedBookingIds = [],
}: {
  initialBookings: Booking[];
  reviewedBookingIds?: string[];
}) {
  // Local state so cancel / review feel instant; the actions persist + revalidate.
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [reviewed, setReviewed] = useState<Set<string>>(
    () => new Set(reviewedBookingIds),
  );

  const upcoming = bookings.filter((b) => b.status !== "completed");
  const past = bookings.filter((b) => b.status === "completed");

  const setStatus = (id: string, status: BookingStatus) =>
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b)),
    );

  const confirmCancel = () => {
    if (cancelling) {
      // Optimistic local update; the action persists + revalidates.
      setStatus(cancelling.id, "cancelled");
      void cancelBookingAction(cancelling.id);
    }
    setCancelling(null);
  };

  const handleReview = async (
    bookingId: string,
    rating: number,
    body: string,
  ) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return { ok: false, error: "予約が見つかりません。" };
    const res = await submitReviewAction({
      bookingId,
      spaceId: b.spaceId,
      rating,
      comment: body,
    });
    if (res.ok) setReviewed((prev) => new Set(prev).add(bookingId));
    return res;
  };

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <header className="px-5 pb-2 pt-8">
        <h1 className="font-display text-3xl text-on-surface">予約一覧</h1>
        <p className="text-on-surface-variant">あなたの予約をまとめて確認できます。</p>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-6">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">
            今後の予約（{upcoming.filter((b) => b.status !== "cancelled").length}）
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((b) => {
                const cancelled = b.status === "cancelled";
                return (
                  <div
                    key={b.id}
                    className={cancelled ? "opacity-60" : undefined}
                  >
                    <div className="flex gap-3 rounded-xl border border-border bg-surface-card p-3 shadow-[var(--shadow-card)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.spaceImage}
                        alt={b.spaceTitle}
                        className="h-20 w-24 flex-none rounded-lg object-cover"
                      />
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-lg text-on-surface">
                            {b.spaceTitle}
                          </h3>
                          <Badge
                            tone={
                              b.status === "confirmed"
                                ? "primary"
                                : b.status === "cancelled"
                                  ? "neutral"
                                  : "warning"
                            }
                          >
                            {statusLabel[b.status]}
                          </Badge>
                        </div>
                        <p className="flex items-center gap-1 text-sm text-on-surface-variant">
                          <Icon name="calendar_today" className="text-[15px]" />
                          {b.date}・{b.start}–{b.end}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <span className="font-semibold text-primary">
                            ¥{b.total.toLocaleString()}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            #{b.code}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!cancelled && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setCancelling(b)}
                        >
                          <Icon name="close" className="text-[16px]" /> 予約をキャンセル
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
            過去の利用（{past.length}）
          </h2>
          <div className="flex flex-col gap-3">
            {past.map((b) => {
              const hasReviewed = reviewed.has(b.id);
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.spaceImage}
                    alt={b.spaceTitle}
                    className="h-14 w-16 flex-none rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">{b.spaceTitle}</p>
                    <p className="text-sm text-on-surface-variant">{b.date}</p>
                  </div>
                  {hasReviewed ? (
                    <span className="flex items-center gap-1 text-sm font-semibold text-success">
                      <Icon name="check_circle" className="text-[18px]" /> レビュー済み
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setReviewing(b)}
                    >
                      <Icon name="star" className="text-[16px]" /> レビューを書く
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <ButtonLink href="/spaces" variant="secondary" fullWidth>
          <Icon name="search" className="text-[18px]" /> 新しいスペースを探す
        </ButtonLink>
      </main>

      {/* Cancel confirmation */}
      {cancelling && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            aria-label="閉じる"
            onClick={() => setCancelling(null)}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-surface-card p-6 shadow-[var(--shadow-soft)] sm:rounded-2xl">
            <h2 className="font-display text-xl text-on-surface">
              予約をキャンセルしますか？
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              {cancelling.spaceTitle}・{cancelling.date} {cancelling.start}–
              {cancelling.end} の予約をキャンセルします。この操作は取り消せません。
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setCancelling(null)}
              >
                戻る
              </Button>
              <Button variant="danger" size="md" fullWidth onClick={confirmCancel}>
                キャンセルする
              </Button>
            </div>
          </div>
        </div>
      )}

      <ReviewDialog
        key={reviewing?.id ?? "none"}
        booking={reviewing}
        onClose={() => setReviewing(null)}
        onSubmit={handleReview}
      />

      <GuestNav />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-card/50 px-5 py-10 text-center">
      <Icon name="event_available" className="text-[32px] text-on-surface-variant/50" />
      <p className="text-sm text-on-surface-variant">
        今後の予約はありません。気になるスペースを探してみましょう。
      </p>
      <Link href="/spaces" className="text-sm font-semibold text-primary hover:underline">
        スペースを探す →
      </Link>
    </div>
  );
}
