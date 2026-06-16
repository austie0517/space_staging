"use client";

import Link from "next/link";
import { Button, ButtonLink, Icon } from "../_components/ui";
import { GuestNav } from "../_components/GuestNav";
import { sampleGuest } from "@/lib/sampleData";
import { kycStatusLabel } from "@/mock";
import type { KycStatus } from "@/types";

export type GuestProfile = {
  name: string;
  email: string;
  phone: string;
  profession: string;
  license: string;
  avatarUrl: string;
};

/** My-page hub: profile + account settings. Booking history lives at /guest/bookings. */
export function MeClient({
  profile,
  kycStatus,
}: {
  profile: GuestProfile;
  kycStatus: KycStatus;
}) {
  return (
    <div className="min-h-screen pb-24 md:pt-14">
      {/* Profile header */}
      <header className="mx-auto flex max-w-3xl items-center gap-4 px-5 pb-4 pt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl || sampleGuest.avatar}
          alt={profile.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <h1 className="font-display text-2xl text-on-surface">{profile.name}</h1>
          <p className="text-sm text-on-surface-variant">{profile.profession}</p>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
        {/* Registered info */}
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-on-surface">登録情報</h2>
            <ButtonLink href="/me/profile/edit" variant="ghost" size="sm">
              <Icon name="edit" className="text-[18px]" />
              編集する
            </ButtonLink>
          </div>
          <Row label="お名前" value={profile.name} />
          <Row label="メール" value={profile.email} />
          <Row label="電話番号" value={profile.phone || "未設定"} />
          <Row label="職種" value={profile.profession} />
          <Row label="保有資格" value={profile.license || "—"} />
        </div>

        {/* Account */}
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 font-display text-lg text-on-surface">アカウント</h2>
          <MenuRow
            icon="calendar_today"
            label="予約一覧"
            href="/guest/bookings"
          />
          <MenuRow icon="favorite" label="お気に入り" href="/me/favorites" />
          <MenuRow
            icon="verified_user"
            label="本人確認"
            href="/me/verify"
            hint={kycStatusLabel[kycStatus]}
          />
          <MenuRow icon="payment" label="お支払い方法" href="/me/payment" />
          <MenuRow icon="notifications" label="通知・LINE連携" href="/me/settings" />
          <MenuRow
            icon="description"
            label="利用規約・キャンセルポリシー"
            href="/agreements"
          />
          <MenuRow icon="help" label="ヘルプ・サポート" />
        </div>

        {/* Find spaces */}
        <ButtonLink href="/spaces" fullWidth size="lg">
          <Icon name="search" className="text-[18px]" /> 新しいスペースを探す
        </ButtonLink>

        <Button variant="secondary" fullWidth>
          ログアウト
        </Button>
      </main>

      <GuestNav />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  href,
  hint,
}: {
  icon: string;
  label: string;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <>
      <Icon name={icon} className="text-on-surface-variant" />
      <span className="flex-1 text-on-surface">{label}</span>
      {hint && <span className="text-sm text-on-surface-variant">{hint}</span>}
      <Icon name="chevron_right" className="text-on-surface-variant" />
    </>
  );
  const className =
    "flex w-full items-center gap-3 border-b border-border py-3 text-left last:border-0";

  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <button className={className}>{inner}</button>
  );
}
