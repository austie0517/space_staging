"use client";

import Link from "next/link";
import { Button, Icon } from "../../_components/ui";

const PROFESSIONS = [
  "美容師 / ヘアスタイリスト",
  "ネイリスト",
  "アイリスト",
  "エステティシャン",
  "フォトグラファー",
  "その他",
];

export default function GuestSignupPage() {
  return (
    <main className="min-h-screen bg-surface-low">
      <div className="mx-auto max-w-lg px-5 py-8">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Icon name="arrow_back" className="text-[18px]" /> ログインへ戻る
        </Link>

        <h1 className="font-display text-3xl text-on-surface">施術者登録</h1>
        <p className="mt-2 text-on-surface-variant">
          審査通過後にスペースの予約が可能になります。
        </p>

        <form
          className="mt-8 flex flex-col gap-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <Section title="基本情報">
            <Input label="お名前" placeholder="山田 花子" />
            <Input label="メールアドレス" type="email" placeholder="name@example.com" />
            <Input label="パスワード" type="password" placeholder="8文字以上" />
            <Input label="電話番号" type="tel" placeholder="090-1234-5678" />
          </Section>

          <Section title="職種・資格">
            <Field label="職種">
              <select className="w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-primary">
                {PROFESSIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Input
              label="保有資格・免許番号"
              placeholder="例：美容師免許 第123456号"
            />
          </Section>

          <Section title="本人確認書類">
            <Upload hint="運転免許証・パスポート等（美容師は免許証も）" />
          </Section>

          <label className="flex items-start gap-2 text-sm text-on-surface-variant">
            <input type="checkbox" className="mt-1 accent-[var(--color-primary)]" />
            <span>
              <a href="#" className="text-primary hover:underline">利用規約</a>
              および
              <a href="#" className="text-primary hover:underline">プライバシーポリシー</a>
              に同意します
            </span>
          </label>

          <Button type="submit" size="lg" fullWidth>
            審査を申請する
          </Button>
        </form>
      </div>
    </main>
  );
}

/* shared bits reused by both signup forms */

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-card p-5">
      <h2 className="mb-4 font-display text-xl text-on-surface">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-on-surface">{label}</span>
      {children}
    </label>
  );
}

export function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label}>
      <input
        {...props}
        className="rounded-lg border border-border bg-surface px-4 py-3 outline-none transition-colors focus:border-primary"
      />
    </Field>
  );
}

export function Upload({ hint }: { hint: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface px-4 py-8 text-center transition-colors hover:border-primary-container">
      <Icon name="cloud_upload" className="text-3xl text-primary" />
      <span className="font-medium text-on-surface">ファイルをアップロード</span>
      <span className="text-xs text-on-surface-variant">{hint}</span>
      <input type="file" className="hidden" accept="image/*,application/pdf" />
    </label>
  );
}
