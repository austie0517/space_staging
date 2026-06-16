"use client";

import { Badge, Button, Icon } from "../_components/ui";
import { AdminShell } from "./AdminShell";
import { useAdmin } from "./AdminContext";

const statusLabel = {
  pending: "審査待ち",
  approved: "承認済",
  rejected: "却下",
} as const;

export default function AdminReviewPage() {
  const { applications, approve, reject } = useAdmin();

  return (
    <AdminShell>
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
          申請リスト
        </h2>
        {applications.map((a) => {
          const isPending = a.status === "pending";
          return (
            <div
              key={a.id}
              className="rounded-xl border border-border bg-surface-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.avatar}
                  alt={a.applicantName}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-on-surface">
                      {a.applicantName}
                    </p>
                    <Badge tone={a.kind === "host" ? "primary" : "neutral"}>
                      {a.kind === "host" ? "ホスト" : "施術者"}
                    </Badge>
                  </div>
                  <p className="text-sm text-on-surface-variant">{a.detail}</p>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {a.submittedAt}
                </span>
              </div>

              {isPending ? (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => approve(a.id, a.kind)}>
                    承認
                  </Button>
                  <Button variant="secondary" size="sm">
                    詳細確認
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-auto"
                    onClick={() => reject(a.id, a.kind)}
                  >
                    却下
                  </Button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1 text-sm font-semibold">
                  <Icon
                    name={a.status === "approved" ? "check_circle" : "cancel"}
                    className={
                      a.status === "approved" ? "text-success" : "text-error"
                    }
                  />
                  <span
                    className={
                      a.status === "approved" ? "text-success" : "text-error"
                    }
                  >
                    {statusLabel[a.status]}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
