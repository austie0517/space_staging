"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, Toast } from "../../_components/ui";
import { samplePaymentCards } from "@/mock";
import type { PaymentCard } from "@/types";

/** Detect a card brand from the leading digits (display-only, mock). */
function detectBrand(num: string): string {
  if (num.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^35/.test(num)) return "JCB";
  return "Card";
}

export default function PaymentPage() {
  const router = useRouter();
  const back = () => router.push("/me?tab=profile");

  const [cards, setCards] = useState<PaymentCard[]>(samplePaymentCards);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  const setDefault = (id: string) =>
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));

  const remove = (id: string) =>
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      // keep a default if we removed it
      if (next.length && !next.some((c) => c.isDefault)) next[0].isDefault = true;
      return next;
    });

  const addCard = (card: Omit<PaymentCard, "id" | "isDefault">) => {
    setCards((prev) => [
      ...prev.map((c) => ({ ...c, isDefault: false })),
      { ...card, id: `card-${prev.length + 1}`, isDefault: true },
    ]);
    setAdding(false);
    flash("カードを登録しました");
  };

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
        <h1 className="font-display text-xl text-on-surface">お支払い方法</h1>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        <div className="flex flex-col gap-3">
          {cards.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-on-surface-variant">
              登録済みのカードはありません。
            </p>
          )}
          {cards.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-4"
            >
              <span className="flex h-10 w-14 flex-none items-center justify-center rounded-md bg-primary-container/30">
                <Icon name="credit_card" className="text-primary" />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-on-surface">
                  {c.brand} •••• {c.last4}
                </p>
                <p className="text-sm text-on-surface-variant">
                  有効期限 {String(c.expMonth).padStart(2, "0")}/{c.expYear}
                </p>
              </div>
              {c.isDefault ? (
                <Badge tone="primary">既定</Badge>
              ) : (
                <button
                  onClick={() => setDefault(c.id)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  既定にする
                </button>
              )}
              <button
                onClick={() => remove(c.id)}
                aria-label="削除"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-error hover:bg-error-container/40"
              >
                <Icon name="delete" className="text-[20px]" />
              </button>
            </div>
          ))}
        </div>

        {adding ? (
          <AddCardForm onAdd={addCard} onCancel={() => setAdding(false)} detectBrand={detectBrand} />
        ) : (
          <Button
            variant="secondary"
            fullWidth
            className="mt-4"
            onClick={() => setAdding(true)}
          >
            <Icon name="add" className="text-[18px]" /> カードを追加
          </Button>
        )}

        <p className="mt-6 flex items-start gap-2 rounded-lg bg-primary-container/20 p-3 text-sm text-on-surface-variant">
          <Icon name="lock" className="text-[18px] text-primary" />
          カード情報は Stripe で安全に管理されます（デモUI）。予約時は事前オーソリ→利用後にキャプチャされます。
        </p>
      </main>

      <Toast show={toast !== null} message={toast ?? ""} />
    </div>
  );
}

function AddCardForm({
  onAdd,
  onCancel,
  detectBrand,
}: {
  onAdd: (card: Omit<PaymentCard, "id" | "isDefault">) => void;
  onCancel: () => void;
  detectBrand: (n: string) => string;
}) {
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");

  const digits = number.replace(/\D/g, "");
  const [mm, yy] = exp.split("/").map((s) => s.trim());
  const valid = digits.length >= 14 && mm && yy && cvc.length >= 3;

  const submit = () => {
    if (!valid) return;
    onAdd({
      brand: detectBrand(digits),
      last4: digits.slice(-4),
      expMonth: Number(mm),
      expYear: 2000 + Number(yy),
    });
  };

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-surface-low p-4">
      <input
        inputMode="numeric"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder="カード番号 1234 5678 9012 3456"
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          value={exp}
          onChange={(e) => setExp(e.target.value)}
          placeholder="MM / YY"
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
        />
        <input
          inputMode="numeric"
          value={cvc}
          onChange={(e) => setCvc(e.target.value)}
          placeholder="CVC"
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" size="md" onClick={onCancel}>
          キャンセル
        </Button>
        <Button size="md" fullWidth disabled={!valid} onClick={submit}>
          このカードを登録
        </Button>
      </div>
    </div>
  );
}
