"use client";

import Link from "next/link";
import { Badge, Button, ButtonLink, Icon } from "../../_components/ui";
import { HostHeader } from "../../_components/HostHeader";
import { HostNav } from "../../_components/HostNav";
import { sampleHost } from "@/mock/users";

export type HostProfile = {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  plan: string;
  address?: string;
};

export function HostMeClient({ profile }: { profile: HostProfile }) {
  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <HostHeader subtitle="マイページ" />

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-6">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl || sampleHost.avatar}
            alt={profile.name}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <h1 className="font-display text-2xl text-on-surface">{profile.name}</h1>
            <Badge tone="primary">{profile.plan} プラン</Badge>
          </div>
        </div>

        {/* Registered info */}
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-on-surface">登録情報</h2>
            <ButtonLink href="/host/me/profile/edit" variant="ghost" size="sm">
              <Icon name="edit" className="text-[18px]" />
              編集する
            </ButtonLink>
          </div>
          <Row label="お名前" value={profile.name} />
          <Row label="メール" value={profile.email} />
          <Row label="電話番号" value={profile.phone || "未設定"} />
          <Row label="住所" value={profile.address || "未設定"} />
          <Row label="プラン" value={profile.plan} />
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 font-display text-lg text-on-surface">管理</h2>
          <MenuRow icon="storefront" label="スペース" href="/host/spaces" />
          <MenuRow icon="event_note" label="予約" href="/host/bookings" />
          <MenuRow icon="payments" label="収益" href="/host/earnings" />
          <MenuRow icon="add_business" label="スペースを新規登録" href="/host/spaces/new" />
        </div>

        <Button variant="secondary" fullWidth>
          ログアウト
        </Button>
      </main>

      <HostNav />
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
}: {
  icon: string;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 border-b border-border py-3 text-left last:border-0"
    >
      <Icon name={icon} className="text-on-surface-variant" />
      <span className="flex-1 text-on-surface">{label}</span>
      <Icon name="chevron_right" className="text-on-surface-variant" />
    </Link>
  );
}
