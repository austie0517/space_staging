import Link from "next/link";
import { Badge, Button, Icon } from "../../_components/ui";
import { HostHeader } from "../../_components/HostHeader";
import { HostNav } from "../../_components/HostNav";
import { getCurrentHostId } from "@/lib/repositories/hostRepository";
import { getHostSpaceFeed } from "@/lib/repositories/spaceRepository";
import { measure } from "@/lib/perf";
import {
  capacityUnitLabel,
  resourceCategoryLabel,
  resourceTypeLabel,
} from "@/lib/resourceClassification";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostSpacesPage() {
  const hostId = await measure("getCurrentHostId(/host/spaces)", () => getCurrentHostId());
  const spaces = hostId
    ? await measure("getHostSpaceFeed", () => getHostSpaceFeed(hostId))
    : [];

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <HostHeader subtitle="スペース管理" />

      <main className="mx-auto max-w-2xl px-5 py-4">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-3xl text-on-surface">スペース</h1>
          <Link href="/host/spaces/new">
            <Button size="sm">
              <Icon name="add" className="text-[18px]" /> 新規登録
            </Button>
          </Link>
        </div>

        {spaces.length === 0 ? (
          <p className="mt-16 text-center text-on-surface-variant">
            まだスペースがありません。「新規登録」から追加してください。
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {spaces.map((s) => (
              <Link
                key={s.id}
                href={`/host/spaces/${s.id}`}
                className="flex gap-4 rounded-xl border border-border bg-surface-card p-3 shadow-card transition-all hover:border-primary-container"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.images[0]}
                  alt={s.title}
                  className="h-24 w-28 flex-none rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg text-on-surface">{s.title}</h2>
                    {s.published && <Badge tone="success">公開中</Badge>}
                  </div>
                  <p className="text-sm text-on-surface-variant">{s.area}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {resourceCategoryLabel(s.resourceCategory)} ・{" "}
                    {resourceTypeLabel(s.spaceType)}
                  </p>
                  <p className="mt-1 text-sm text-primary">
                    ¥{s.pricePerHour.toLocaleString()} / 時 ・ 最大{s.capacity}
                    {capacityUnitLabel(s.capacityUnit)} ・ ★{s.rating}
                  </p>
                </div>
                <Icon
                  name="chevron_right"
                  className="self-center text-on-surface-variant"
                />
              </Link>
            ))}
          </div>
        )}
      </main>

      <HostNav />
    </div>
  );
}
