"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, Toast } from "../../_components/ui";
import { kycStatusLabel } from "@/mock";
import type { KycStatus } from "@/types";
import { submitKycAction } from "./actions";

const statusTone: Record<KycStatus, "neutral" | "warning" | "success"> = {
  unsubmitted: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "warning",
};

export function VerifyClient({ initialStatus }: { initialStatus: KycStatus }) {
  const router = useRouter();
  const back = () => router.push("/me?tab=profile");

  const [status, setStatus] = useState<KycStatus>(initialStatus);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const res = await submitKycAction({ fileName: fileName ?? undefined });
    setSubmitting(false);
    if (res.ok) {
      setStatus("pending");
      setToast("本人確認書類を提出しました。審査をお待ちください。");
    } else {
      setToast(res.error);
    }
    setTimeout(() => setToast(null), 2600);
  };

  const canSubmit = preview !== null && status !== "pending" && !submitting;

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-surface/80 px-3 backdrop-blur-md">
        <button
          onClick={back}
          aria-label="戻る"
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-low"
        >
          <Icon name="arrow_back" />
        </button>
        <h1 className="font-display text-xl text-on-surface">本人確認</h1>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-6">
        {/* Status */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/30">
              <Icon name="verified_user" className="text-primary" />
            </span>
            <div>
              <p className="text-sm text-on-surface-variant">確認ステータス</p>
              <p className="font-semibold text-on-surface">本人確認書類</p>
            </div>
          </div>
          <Badge tone={statusTone[status]}>{kycStatusLabel[status]}</Badge>
        </div>

        <p className="rounded-lg bg-surface-low p-4 text-sm leading-relaxed text-on-surface-variant">
          スペースのご利用には本人確認が必要です。運転免許証・パスポートなど、
          顔写真付きの公的書類を1点アップロードしてください。担当者が確認のうえ承認します。
        </p>

        {/* Upload */}
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            preview
              ? "border-primary/50 bg-primary-container/10"
              : "border-border bg-surface-card hover:bg-surface-low"
          }`}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="アップロード書類"
                className="max-h-48 w-auto rounded-lg object-contain"
              />
              <span className="text-sm text-on-surface-variant">{fileName}</span>
              <span className="text-sm font-semibold text-primary">別の画像を選ぶ</span>
            </>
          ) : (
            <>
              <Icon name="add_a_photo" className="text-[32px] text-primary" />
              <span className="font-semibold text-on-surface">免許証などをアップロード</span>
              <span className="text-xs text-on-surface-variant">
                JPG / PNG（タップして選択）
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onPick}
            className="sr-only"
            disabled={status === "pending"}
          />
        </label>

        {status === "pending" && (
          <p className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Icon name="hourglass_top" className="text-[18px] text-primary" />
            提出済みです。審査結果をお待ちください。
          </p>
        )}
      </main>

      {/* Sticky submit */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-5 py-3">
          <Button fullWidth size="lg" disabled={!canSubmit} onClick={submit}>
            {status === "pending"
              ? "審査中"
              : submitting
                ? "提出中..."
                : "本人確認書類を提出する"}
          </Button>
        </div>
      </div>

      <Toast show={toast !== null} message={toast ?? ""} />
    </div>
  );
}
