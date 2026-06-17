"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge, cn } from "../../_components/ui";
import { AdminShell } from "../AdminShell";
import type { Space } from "@/types";

type Pub = "all" | "published" | "unpublished";

const PUB_FILTERS: { key: Pub; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "published", label: "公開中" },
  { key: "unpublished", label: "非公開" },
];

export function AdminSpacesClient({
  spaces,
  total,
  page,
  pageSize,
}: {
  spaces: Space[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const [pub, setPub] = useState<Pub>("all");
  const [area, setArea] = useState("all");

  const areas = useMemo(
    () => Array.from(new Set(spaces.map((s) => s.area))),
    [spaces],
  );

  const visible = spaces.filter((s) => {
    const byPub =
      pub === "all" || (pub === "published" ? s.published : !s.published);
    const byArea = area === "all" || s.area === area;
    return byPub && byArea;
  });

  return (
    <AdminShell>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        全スペース（{total}件中 {visible.length}件表示・{page} / {Math.max(1, Math.ceil(total / pageSize))}ページ）
      </h2>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {PUB_FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? spaces.length
                : spaces.filter((s) =>
                    f.key === "published" ? s.published : !s.published,
                  ).length;
            return (
              <button
                key={f.key}
                onClick={() => setPub(f.key)}
                className={cn(
                  "flex-none rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                  pub === f.key
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface-card text-on-surface-variant",
                )}
              >
                {f.label}（{count}）
              </button>
            );
          })}
        </div>

        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[15px] text-on-surface outline-none focus:border-primary"
        >
          <option value="all">すべてのエリア</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-on-surface-variant">
            条件に合うスペースはありません。
          </p>
        )}
        {visible.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3"
          >
            <Image
              src={s.images[0]}
              alt={s.title}
              width={64}
              height={56}
              sizes="64px"
              className="h-14 w-16 flex-none rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-on-surface">{s.title}</p>
              <p className="text-sm text-on-surface-variant">
                {s.area}・¥{s.pricePerHour.toLocaleString()}/時
              </p>
            </div>
            <Badge tone={s.published ? "success" : "neutral"}>
              {s.published ? "公開中" : "非公開"}
            </Badge>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
