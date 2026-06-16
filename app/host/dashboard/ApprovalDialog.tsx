"use client";

import { useEffect, useState } from "react";
import {
  BOOKING_REJECTION_TEMPLATES,
  type BookingRejectionReasonCode,
} from "@/lib/bookingRejectionTemplates";
import { Button, Icon } from "../../_components/ui";
import type { Booking } from "@/lib/sampleData";
import { setBookingStatusAction } from "./actions";

/** Booking-request approval sheet (host side). */
export function ApprovalDialog({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<BookingRejectionReasonCode>(
    BOOKING_REJECTION_TEMPLATES[0].code,
  );
  const [message, setMessage] = useState(BOOKING_REJECTION_TEMPLATES[0].message);
  const [note, setNote] = useState("");

  useEffect(() => {
    document.body.style.overflow = booking ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [booking]);

  if (!booking) return null;

  const selectedTemplate =
    BOOKING_REJECTION_TEMPLATES.find((template) => template.code === reasonCode) ??
    BOOKING_REJECTION_TEMPLATES[0];

  const decide = async (status: "approved" | "rejected") => {
    setPending(true);
    setError(null);
    const rejectionMessage = [message.trim(), note.trim()].filter(Boolean).join("\n\n");
    const res = await setBookingStatusAction(
      booking.id,
      status,
      status === "rejected"
        ? {
            reasonCode,
            message: rejectionMessage,
          }
        : undefined,
    );
    setPending(false);
    if (res.ok) onClose();
    else setError(res.error);
  };

  const openRejectComposer = () => {
    setRejectOpen(true);
    setReasonCode(BOOKING_REJECTION_TEMPLATES[0].code);
    setMessage(BOOKING_REJECTION_TEMPLATES[0].message);
    setNote("");
    setError(null);
  };

  const selectReason = (nextCode: BookingRejectionReasonCode) => {
    const nextTemplate =
      BOOKING_REJECTION_TEMPLATES.find((template) => template.code === nextCode) ??
      BOOKING_REJECTION_TEMPLATES[0];
    setReasonCode(nextCode);
    setMessage(nextTemplate.message);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-start md:overflow-y-auto md:px-6 md:pb-8 md:pt-20">
      <button
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-surface-low shadow-[var(--shadow-soft)] md:max-h-[calc(100dvh-7rem)] md:max-w-2xl md:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface-card px-5 py-4">
          <button
            onClick={onClose}
            aria-label="戻る"
            className="text-primary"
          >
            <Icon name="arrow_back" />
          </button>
          <h2 className="font-display text-xl text-primary">予約リクエストの承認</h2>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          {/* Guest */}
          <div className="rounded-xl bg-surface-card p-4">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={booking.guestAvatar}
                alt={booking.guestName}
                className="h-16 w-16 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  Guest Profile
                </p>
                <p className="truncate font-display text-xl text-on-surface">
                  {booking.guestName}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-low px-2 py-1">
                    <Icon name="work" className="text-[14px]" />
                    {booking.guestProfession || "職種未設定"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-low px-2 py-1">
                    <Icon
                      name={booking.guestVerified ? "verified_user" : "shield"}
                      className="text-[14px]"
                    />
                    {booking.guestVerified ? "本人確認済み" : "本人確認未完了"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <ProfileMetric
                label="利用回数"
                value={`${booking.guestUsageCount ?? 0}回`}
              />
              <ProfileMetric
                label="レビュー"
                value={
                  booking.guestReviewCount
                    ? `★ ${booking.guestRating?.toFixed(1)}`
                    : "なし"
                }
              />
              <ProfileMetric label="登録" value={booking.guestJoinedAt || "未設定"} />
            </div>

            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="mt-4 flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm font-semibold text-primary transition-colors hover:bg-surface-low"
            >
              プロフィールを見る
              <Icon
                name={profileOpen ? "expand_less" : "expand_more"}
                className="text-[20px]"
              />
            </button>

            {profileOpen && <GuestProfileDetails booking={booking} />}
          </div>

          {/* Message */}
          {booking.message && (
            <div className="rounded-xl bg-surface-card p-4">
              <h3 className="font-display text-lg text-on-surface">
                ゲストからのメッセージ
              </h3>
              <p className="mt-2 leading-relaxed text-on-surface-variant">
                「{booking.message}」
              </p>
            </div>
          )}

          {/* Booking facts */}
          <div className="rounded-xl bg-surface-card p-4">
            <p className="font-display text-xl text-primary">{booking.spaceTitle}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                  Date
                </p>
                <p className="font-semibold text-on-surface">{booking.date}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                  Time
                </p>
                <p className="font-semibold text-on-surface">
                  {booking.start} – {booking.end}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-primary-container/20 px-4 py-3">
              <span className="text-sm font-semibold text-on-primary-container">
                ホスト収益
              </span>
              <span className="font-display text-2xl text-primary">
                ¥{booking.hostEarnings.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl bg-surface-card p-4">
            <h3 className="font-display text-lg text-on-surface">リクエストを処理</h3>
            {error && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-error">
                <Icon name="error" className="text-[18px]" />
                {error}
              </p>
            )}
            <div className="mt-4 flex flex-col gap-3">
              <Button
                size="lg"
                fullWidth
                disabled={pending}
                onClick={() => decide("approved")}
              >
                {pending ? "処理中..." : "承認する"}
                <Icon name="check_circle" className="text-[20px]" />
              </Button>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                disabled={pending}
                onClick={openRejectComposer}
              >
                辞退する <Icon name="cancel" className="text-[20px]" />
              </Button>
            </div>
            <p className="mt-3 text-xs text-on-surface-variant">
              承認すると、ゲストに通知が届き、予約が確定します。キャンセルポリシーが適用されます。
            </p>
          </div>
        </div>
      </div>
      {rejectOpen && (
        <div className="absolute inset-0 z-20 flex items-end justify-center md:items-center">
          <button
            type="button"
            aria-label="辞退理由の設定を閉じる"
            onClick={() => setRejectOpen(false)}
            className="absolute inset-0 bg-on-surface/50"
          />
          <div className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface-card shadow-[var(--shadow-soft)] md:max-h-[75dvh] md:rounded-2xl">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg text-on-surface">
                    辞退理由を設定
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    理由カテゴリと案内文を整えてから、ゲストへ通知します。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectOpen(false)}
                  className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-low"
                  aria-label="辞退設定を閉じる"
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {BOOKING_REJECTION_TEMPLATES.map((template) => {
                  const active = template.code === reasonCode;
                  return (
                    <button
                      key={template.code}
                      type="button"
                      onClick={() => selectReason(template.code)}
                      className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? "border-error bg-error text-on-error"
                          : "border-border bg-surface text-on-surface-variant hover:bg-surface-low"
                      }`}
                    >
                      {template.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg bg-surface-low p-4">
                <p className="text-sm font-semibold text-on-surface">
                  {selectedTemplate.title}
                </p>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  定型コメント
                </label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary"
                />
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  任意の追記コメント
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="必要があれば、別日程のご相談や補足事項を追記してください。"
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary"
                />
              </div>
            </div>

            <div className="border-t border-border bg-surface-card px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={pending}
                  onClick={() => setRejectOpen(false)}
                >
                  戻る
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  disabled={pending || !message.trim()}
                  onClick={() => decide("rejected")}
                >
                  {pending ? "処理中..." : "理由を添えて辞退する"}
                  <Icon name="send" className="text-[18px]" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-low px-2 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function GuestProfileDetails({ booking }: { booking: Booking }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-surface p-4">
      <h3 className="font-display text-lg text-on-surface">ゲスト詳細</h3>
      <dl className="mt-3 flex flex-col divide-y divide-border text-sm">
        <ProfileRow label="名前" value={booking.guestName} />
        <ProfileRow label="職種" value={booking.guestProfession || "未設定"} />
        <ProfileRow label="資格・肩書き" value={booking.guestLicense || "未設定"} />
        <ProfileRow
          label="本人確認"
          value={booking.guestVerified ? "確認済み" : "未確認"}
        />
        <ProfileRow
          label="過去の利用"
          value={`${booking.guestUsageCount ?? 0}回`}
        />
        <ProfileRow
          label="レビュー"
          value={
            booking.guestReviewCount
              ? `★ ${booking.guestRating?.toFixed(1)}（${booking.guestReviewCount}件）`
              : "まだレビューはありません"
          }
        />
      </dl>
      <p className="mt-3 rounded-lg bg-primary-container/20 px-3 py-2 text-xs leading-relaxed text-on-primary-container">
        承認前は、必要最小限のプロフィール情報だけを表示します。連絡先などの個人情報は承認後の予約管理で扱います。
      </p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-right font-semibold text-on-surface">{value}</dd>
    </div>
  );
}
