"use client";

import Link from "next/link";
import { Button, Icon } from "../../_components/ui";
import { Section, Field, Input, Upload } from "../guest/page";

export default function HostSignupPage() {
  return (
    <main className="min-h-screen bg-surface-low">
      <div className="mx-auto max-w-lg px-5 py-8">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Icon name="arrow_back" className="text-[18px]" /> ログインへ戻る
        </Link>

        <h1 className="font-display text-3xl text-on-surface">ホスト登録</h1>
        <p className="mt-2 text-on-surface-variant">
          あなたのスペースで、誰かの創造性を解き放とう。
        </p>

        <form
          className="mt-8 flex flex-col gap-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <Section title="基本情報">
            <Input label="お名前 / 担当者名" placeholder="田中 芳子" />
            <Input label="メールアドレス" type="email" placeholder="host@example.com" />
            <Input label="パスワード" type="password" placeholder="8文字以上" />
            <Input label="電話番号" type="tel" placeholder="03-1234-5678" />
          </Section>

          <Section title="事業者情報">
            <Input label="屋号 / 店舗名" placeholder="Atelier Lumina" />
            <Field label="事業形態">
              <select className="w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-primary">
                <option>個人事業主</option>
                <option>法人</option>
              </select>
            </Field>
            <Input label="所在地" placeholder="東京都渋谷区道玄坂1-2-3" />
          </Section>

          <Section title="本人確認・許認可書類">
            <Upload hint="本人確認書類（運転免許証等）" />
            <p className="text-sm text-on-surface-variant">
              美容業のスペースを貸し出す場合は、保健所の確認済証等もご提出ください。
            </p>
            <Upload hint="営業許可・確認済証など（任意）" />
          </Section>

          <Section title="振込先口座">
            <Input label="金融機関名" placeholder="○○銀行 △△支店" />
            <Input label="口座番号" placeholder="普通 1234567" />
          </Section>

          <label className="flex items-start gap-2 text-sm text-on-surface-variant">
            <input type="checkbox" className="mt-1 accent-[var(--color-primary)]" />
            <span>
              <a href="#" className="text-primary hover:underline">ホスティング規約</a>
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
