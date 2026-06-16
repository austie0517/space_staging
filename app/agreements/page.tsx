"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, Toast } from "../_components/ui";

export default function AgreementsPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [toast, setToast] = useState(false);

  const accept = () => {
    setToast(true);
    setTimeout(() => router.push("/me?tab=profile"), 1100);
  };

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-surface/80 px-3 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          aria-label="戻る"
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-low"
        >
          <Icon name="arrow_back" />
        </button>
        <h1 className="font-display text-xl text-on-surface">利用規約・キャンセルポリシー</h1>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
        <Section title="利用規約">
          <P>本サービスは、スペースの貸主（ホスト）と借主（ゲスト）をつなぐ予約プラットフォームです。ゲストは予約したスペースを、定められた時間・用途の範囲内で利用するものとします。</P>
          <P>本人確認が完了していない場合、予約が承認されないことがあります。スペース内の設備・備品は善良な管理者の注意をもって使用し、破損・汚損が生じた場合は実費を負担いただきます。</P>
          <P>無断での利用時間の超過、第三者への又貸し、禁止された用途での使用が判明した場合、運営はアカウントを停止することがあります。</P>
        </Section>

        <Section title="キャンセルポリシー">
          <Policy when="利用7日前まで" rate="全額返金" />
          <Policy when="利用3日前まで" rate="50%返金" />
          <Policy when="利用2日前以降" rate="返金なし" />
          <P className="mt-2">
            ホスト都合によるキャンセルの場合は、時期にかかわらず全額返金されます。返金はご登録の決済方法へ行われます。
          </P>
        </Section>

        <Section title="決済について">
          <P>予約確定時にカードへ事前オーソリ（与信枠の確保）を行い、利用完了後にキャプチャ（実際の請求）が行われます。前払い制です。</P>
        </Section>

        <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
          <span className="text-on-surface">
            上記の利用規約とキャンセルポリシーに同意します
          </span>
        </label>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-5 py-3">
          <Button fullWidth size="lg" disabled={!agreed} onClick={accept}>
            同意して続ける
          </Button>
        </div>
      </div>

      <Toast show={toast} message="同意を記録しました" />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 font-display text-xl text-on-surface">{title}</h2>
      <div className="rounded-xl border border-border bg-surface-card p-5">
        {children}
      </div>
    </section>
  );
}

function P({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm leading-relaxed text-on-surface-variant ${className ?? ""}`}>
      {children}
    </p>
  );
}

function Policy({ when, rate }: { when: string; rate: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-on-surface">{when}</span>
      <span className="font-semibold text-on-surface">{rate}</span>
    </div>
  );
}
