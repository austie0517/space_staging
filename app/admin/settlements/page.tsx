import { Badge } from "../../_components/ui";
import { AdminShell } from "../AdminShell";
import { getSettlements } from "@/lib/repositories/adminRepository";
import { toUISettlement } from "@/lib/mappers/admin";
import { PayButton } from "./PayButton";

export const dynamic = "force-dynamic";

export default async function AdminSettlementsPage() {
  const settlements = (await getSettlements()).map(toUISettlement);
  const pendingTotal = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.net, 0);

  return (
    <AdminShell>
      <div className="mb-5 rounded-xl bg-primary p-6 text-on-primary">
        <p className="text-sm opacity-90">未払いの精算額</p>
        <p className="mt-1 font-display text-4xl">¥{pendingTotal.toLocaleString()}</p>
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        精算一覧
      </h2>
      <div className="flex flex-col gap-3">
        {settlements.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-border bg-surface-card p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">{s.hostName}</p>
                <p className="text-sm text-on-surface-variant">{s.period}</p>
              </div>
              <Badge tone={s.status === "paid" ? "success" : "warning"}>
                {s.status === "paid" ? "支払済" : "未払い"}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-sm">
              <Cell label="売上" value={s.gross} />
              <Cell label="手数料" value={-s.fee} />
              <Cell label="振込額" value={s.net} strong />
            </div>
            {s.status === "pending" && <PayButton id={s.id} />}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function Cell({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p
        className={
          strong ? "font-display text-lg text-primary" : "font-semibold text-on-surface"
        }
      >
        {value < 0 ? "−" : ""}¥{Math.abs(value).toLocaleString()}
      </p>
    </div>
  );
}
