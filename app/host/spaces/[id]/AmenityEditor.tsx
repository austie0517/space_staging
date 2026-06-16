"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon, cn } from "../../../_components/ui";
import { amenityIcon } from "@/lib/amenityIcon";
import { toggleSpaceTagAction } from "./actions";

export type AmenityTag = { id: string; name: string; category: string | null };

/**
 * Host amenity picker: pick from the DB template catalog (grouped by category).
 * Toggling persists to space_tag_relations and refreshes the route.
 */
export function AmenityEditor({
  spaceId,
  allTags,
  selectedIds,
}: {
  spaceId: string;
  allTags: AmenityTag[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [pending, startTransition] = useTransition();

  const toggle = async (tagId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(tagId) ? next.delete(tagId) : next.add(tagId);
      return next;
    });
    const res = await toggleSpaceTagAction(spaceId, tagId);
    if (res.ok) startTransition(() => router.refresh());
    else
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(tagId) ? next.delete(tagId) : next.add(tagId);
        return next;
      });
  };

  // Group by category (preserving catalog order).
  const groups = new Map<string, AmenityTag[]>();
  for (const t of allTags) {
    const c = t.category ?? "その他";
    (groups.get(c) ?? groups.set(c, []).get(c)!).push(t);
  }

  return (
    <div className="rounded-xl border border-border bg-surface-card p-5">
      <h3 className="font-display text-lg text-on-surface">設備・備品</h3>
      <p className="mb-4 text-sm text-on-surface-variant">
        該当する設備をタップして選んでください。
      </p>

      <div className={cn("flex flex-col gap-4", pending && "opacity-60")}>
        {[...groups.entries()].map(([category, tags]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {category}
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const on = selected.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                      on
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border bg-surface text-on-surface-variant hover:bg-surface-low",
                    )}
                  >
                    <Icon name={amenityIcon(t.name)} className="text-[18px]" />
                    {t.name}
                    {on && <Icon name="check" className="text-[16px]" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
