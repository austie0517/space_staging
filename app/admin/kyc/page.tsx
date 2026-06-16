"use client";

import { Badge, Button, Icon } from "../../_components/ui";
import { AdminShell } from "../AdminShell";
import { useAdmin } from "../AdminContext";
import { kycStatusLabel } from "@/mock";
import type { KycStatus } from "@/types";

const statusTone: Record<KycStatus, "neutral" | "warning" | "success"> = {
  unsubmitted: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "neutral",
};

export default function AdminKycPage() {
  const { kycSubmissions, approveKyc, rejectKyc } = useAdmin();
  const pending = kycSubmissions.filter((k) => k.status === "pending");

  return (
    <AdminShell>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        本人確認（審査待ち {pending.length}）
      </h2>

      <div className="flex flex-col gap-3">
        {kycSubmissions.map((k) => {
          const isPending = k.status === "pending";
          return (
            <div
              key={k.id}
              className="rounded-xl border border-border bg-surface-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={k.avatar}
                  alt={k.userName}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-on-surface">{k.userName}</p>
                  <p className="text-sm text-on-surface-variant">
                    {k.docType}・{k.submittedAt}
                  </p>
                </div>
                <Badge tone={statusTone[k.status]}>{kycStatusLabel[k.status]}</Badge>
              </div>

              {/* Document preview placeholder */}
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-low p-3 text-sm text-on-surface-variant">
                <Icon name="badge" className="text-[20px] text-primary" />
                提出書類：{k.docType}（画像）
              </div>

              {isPending && (
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <Button size="sm" onClick={() => approveKyc(k.id)}>
                    <Icon name="check" className="text-[16px]" /> 承認
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-auto"
                    onClick={() => rejectKyc(k.id)}
                  >
                    却下
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
