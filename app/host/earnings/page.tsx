import { Badge, Icon } from "../../_components/ui";
import { HostHeader } from "../../_components/HostHeader";
import { HostNav } from "../../_components/HostNav";
import { getCurrentHostId } from "@/lib/repositories/hostRepository";
import { getHostBookingEarningsSummary } from "@/lib/repositories/bookingRepository";
import { getSettlementsByHost } from "@/lib/repositories/adminRepository";
import { measure } from "@/lib/perf";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString()}`;
const pad = (n: number) => String(n).padStart(2, "0");

export default async function HostEarningsPage() {
  const hostId = await measure("getCurrentHostId(/host/earnings)", () => getCurrentHostId());
  const [earningsByStatus, settlements] = hostId
    ? await measure("/host/earnings data", () =>
        Promise.all([
          getHostBookingEarningsSummary(hostId),
          getSettlementsByHost(hostId),
        ]),
      )
    : [[], []];

  const earningsMap = new Map(
    earningsByStatus.map((row) => [
      row.status,
      Math.max(0, (row._sum.totalPrice ?? 0) - (row._sum.platformFee ?? 0)),
    ]),
  );

  const confirmed =
    (earningsMap.get("approved") ?? 0) + (earningsMap.get("completed") ?? 0);
  const pending = earningsMap.get("pending") ?? 0;
  const projected = confirmed + pending;
  const paidOut = settlements
    .filter((s) => s.status === "paid")
    .reduce((s, x) => s + x.payoutAmount, 0);
  const pendingPayout = Math.max(0, confirmed - paidOut);

  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <HostHeader subtitle="収益" />

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-4">
        <h1 className="font-display text-3xl text-on-surface">収益</h1>

        <div className="rounded-xl bg-primary p-6 text-on-primary">
          <p className="text-sm opacity-90">{monthLabel} 時点の収益（予測）</p>
          <p className="mt-1 font-display text-4xl">{yen(projected)}</p>
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <p className="opacity-80">確定</p>
              <p className="font-semibold">{yen(confirmed)}</p>
            </div>
            <div>
              <p className="opacity-80">承認待ち</p>
              <p className="font-semibold">{yen(pending)}</p>
            </div>
            <div>
              <p className="opacity-80">未払い分</p>
              <p className="font-semibold">{yen(pendingPayout)}</p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
            振込履歴
          </h2>
          {settlements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-on-surface-variant">
              まだ振込履歴はありません。
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {settlements.map((s) => {
                const when = s.paidAt ?? s.periodEnd ?? s.createdAt;
                const date = `${when.getFullYear()}/${pad(when.getMonth() + 1)}/${pad(when.getDate())}`;
                const paid = s.status === "paid";
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          paid
                            ? "bg-success-container"
                            : "bg-tertiary-container/50"
                        }`}
                      >
                        <Icon
                          name="payments"
                          className={`text-[20px] ${paid ? "text-success" : "text-on-surface-variant"}`}
                        />
                      </span>
                      <div>
                        <p className="font-semibold text-on-surface">
                          {yen(s.payoutAmount)}
                        </p>
                        <p className="text-sm text-on-surface-variant">{date}</p>
                      </div>
                    </div>
                    <Badge tone={paid ? "success" : "warning"}>
                      {paid ? "支払済" : "未払い"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <HostNav />
    </div>
  );
}
