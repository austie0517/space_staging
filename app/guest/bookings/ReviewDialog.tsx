"use client";

import { useEffect, useState } from "react";
import { Button, Icon, cn } from "../../_components/ui";
import type { Booking } from "@/lib/sampleData";

/**
 * Guest review composer — opens for a `completed` booking. Collects a star
 * rating + comment and reports back via onSubmit, which persists to the
 * `reviews` table and returns whether it succeeded.
 */
export function ReviewDialog({
  booking,
  onClose,
  onSubmit,
}: {
  booking: Booking | null;
  onClose: () => void;
  onSubmit: (
    bookingId: string,
    rating: number,
    body: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  // Fresh state per booking comes from the remount `key` set by the parent,
  // so this effect only syncs the one external system: body scroll lock.
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!booking) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [booking]);

  if (!booking) return null;

  const submit = async () => {
    if (rating < 1 || saving) return;
    setSaving(true);
    setError(null);
    const res = await onSubmit(booking.id, rating, body.trim());
    setSaving(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "投稿に失敗しました。");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-surface-card shadow-[var(--shadow-soft)] sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-xl text-on-surface">レビューを書く</h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-low"
          >
            <Icon name="close" />
          </button>
        </header>

        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-container">
              <Icon name="check" filled className="text-[32px] text-success" />
            </span>
            <h3 className="font-display text-2xl text-on-surface">投稿しました</h3>
            <p className="max-w-xs text-sm text-on-surface-variant">
              {booking.spaceTitle} へのレビューをありがとうございます。
            </p>
            <Button fullWidth size="lg" onClick={onClose}>
              閉じる
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={booking.spaceImage}
                  alt={booking.spaceTitle}
                  className="h-14 w-16 flex-none rounded-lg object-cover"
                />
                <div>
                  <p className="font-semibold text-on-surface">{booking.spaceTitle}</p>
                  <p className="text-sm text-on-surface-variant">{booking.date}</p>
                </div>
              </div>

              {/* Star picker */}
              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-sm font-semibold text-on-surface-variant">
                  評価を選んでください
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const active = i <= (hover || rating);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`${i} つ星`}
                        className="p-1"
                      >
                        <span
                          aria-hidden
                          style={{ fontSize: 36 }}
                          className={cn(
                            "material-symbols-outlined transition-colors",
                            active
                              ? "filled text-primary"
                              : "text-on-surface-variant/30",
                          )}
                        >
                          star
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="mt-6 flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  コメント（任意）
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="スペースの雰囲気や設備、ホストの対応はいかがでしたか？"
                  className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
                />
              </label>
            </div>

            <footer className="border-t border-border px-6 py-4">
              {error && (
                <p className="mb-2 flex items-center gap-1.5 text-sm text-error">
                  <Icon name="error" className="text-[18px]" />
                  {error}
                </p>
              )}
              <Button
                fullWidth
                size="lg"
                disabled={rating < 1 || saving}
                onClick={submit}
              >
                {saving ? "投稿中..." : "レビューを投稿する"}
              </Button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
