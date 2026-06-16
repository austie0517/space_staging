"use client";

import { useEffect, useState } from "react";
import { cn } from "./ui";

type NotificationRole = "guest" | "host" | "admin";

export function useNotificationUnreadCount(
  role: NotificationRole,
  types?: string[],
) {
  const [count, setCount] = useState(0);
  const typesKey = (types ?? []).join(",");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const params = new URLSearchParams({ role });
        for (const type of types ?? []) params.append("type", type);
        const res = await fetch(
          `/api/notifications/unread-count?${params.toString()}`,
          {
            cache: "no-store",
          },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled) setCount(data.count ?? 0);
      } catch (e) {
        console.error("[notifications:unread-count] failed:", e);
      }
    }
    void load();
    window.addEventListener("notifications:changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("notifications:changed", load);
    };
  }, [role, types, typesKey]);

  return count;
}

export function NotificationUnreadBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`未読通知 ${count}件`}
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold leading-5 text-on-error shadow-[0_0_0_2px_var(--color-surface)]",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
