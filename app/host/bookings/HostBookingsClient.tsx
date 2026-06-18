"use client";

import { useState } from "react";
import { Badge, Button } from "../../_components/ui";
import { HostHeader } from "../../_components/HostHeader";
import { HostNav } from "../../_components/HostNav";
import { ApprovalDialog } from "../dashboard/ApprovalDialog";
import { statusLabel } from "@/mock";
import type { Booking } from "@/types";

export function HostBookingsClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const [approving, setApproving] = useState<Booking | null>(null);

  const pending = initialBookings.filter((b) => b.status === "pending");
  const confirmed = initialBookings.filter((b) => b.status === "confirmed");
  const past = initialBookings.filter((b) => b.status === "completed");

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <HostHeader subtitle="予約管理" />

      <main className="mx-auto flex max-w-2xl flex-col gap-7 px-5 py-4">
        <h1 className="font-display text-3xl text-on-surface">予約</h1>

        {pending.length > 0 && (
          <Section title={`承認待ち（${pending.length}）`} tone="primary">
            {pending.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-surface-card p-4 shadow-card"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.guestAvatar}
                    alt={b.guestName}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">{b.guestName}</p>
                    <p className="text-sm text-on-surface-variant">
                      {b.spaceTitle}・{b.date}
                    </p>
                  </div>
                  <Badge tone="warning">承認待ち</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">
                    {b.start}–{b.end}・収益 ¥{b.hostEarnings.toLocaleString()}
                  </span>
                  <Button size="sm" onClick={() => setApproving(b)}>
                    確認する
                  </Button>
                </div>
              </div>
            ))}
          </Section>
        )}

        {confirmed.length > 0 && (
          <Section title="確定済み">
            {confirmed.map((b) => (
              <Row key={b.id} b={b} />
            ))}
          </Section>
        )}

        {past.length > 0 && (
          <Section title="過去の予約">
            {past.map((b) => (
              <Row key={b.id} b={b} />
            ))}
          </Section>
        )}

        {initialBookings.length === 0 && (
          <p className="mt-10 text-center text-on-surface-variant">
            まだ予約はありません。
          </p>
        )}
      </main>

      <ApprovalDialog
        key={approving?.id ?? "closed"}
        booking={approving}
        onClose={() => setApproving(null)}
      />
      <HostNav />
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "primary";
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`mb-3 text-sm font-bold uppercase tracking-widest ${
          tone === "primary" ? "text-primary" : "text-on-surface-variant"
        }`}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Row({ b }: { b: Booking }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={b.guestAvatar}
        alt={b.guestName}
        className="h-10 w-10 rounded-full object-cover"
      />
      <div className="flex-1">
        <p className="font-semibold text-on-surface">{b.spaceTitle}</p>
        <p className="text-sm text-on-surface-variant">
          {b.guestName}・{b.date} {b.start}–{b.end}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-on-surface">
          ¥{b.hostEarnings.toLocaleString()}
        </p>
        <Badge tone={b.status === "confirmed" ? "primary" : "neutral"}>
          {statusLabel[b.status]}
        </Badge>
      </div>
    </div>
  );
}
