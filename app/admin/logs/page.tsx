import { Badge, Icon } from "../../_components/ui";
import { AdminShell } from "../AdminShell";
import { auditActionLabel, auditActionIcon, auditActionTone } from "@/mock";
import { getAuditLogs } from "@/lib/repositories/adminRepository";
import { toUIAuditLog } from "@/lib/mappers/admin";

export const dynamic = "force-dynamic";

const toneClasses: Record<
  (typeof auditActionTone)[keyof typeof auditActionTone],
  string
> = {
  success: "bg-success-container text-success",
  error: "bg-error-container text-error",
  warning: "bg-tertiary-container/60 text-on-surface-variant",
  neutral: "bg-surface-high text-on-surface-variant",
};

export default async function AdminLogsPage() {
  const sampleAuditLogs = (await getAuditLogs()).map(toUIAuditLog);

  return (
    <AdminShell>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        監査ログ（{sampleAuditLogs.length}）
      </h2>

      <ol className="relative flex flex-col gap-1 border-l border-border pl-6">
        {sampleAuditLogs.map((log) => {
          const tone = auditActionTone[log.action];
          return (
            <li key={log.id} className="relative pb-5 last:pb-0">
              {/* Timeline dot */}
              <span
                className={`absolute -left-[33px] flex h-7 w-7 items-center justify-center rounded-full ${toneClasses[tone]}`}
              >
                <Icon name={auditActionIcon[log.action]} className="text-[16px]" />
              </span>

              <div className="rounded-xl border border-border bg-surface-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    tone={
                      tone === "success"
                        ? "success"
                        : tone === "warning"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {auditActionLabel[log.action]}
                  </Badge>
                  <time className="text-xs text-on-surface-variant">{log.at}</time>
                </div>

                <p className="mt-2 font-semibold text-on-surface">{log.target}</p>
                {log.detail && (
                  <p className="mt-0.5 text-sm text-on-surface-variant">
                    {log.detail}
                  </p>
                )}
                <p className="mt-2 flex items-center gap-1 text-xs text-on-surface-variant">
                  <Icon name="person" className="text-[14px]" />
                  {log.actor}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </AdminShell>
  );
}
