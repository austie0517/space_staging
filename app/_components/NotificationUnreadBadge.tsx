"use client";

import { useEffect, useState } from "react";
import { cn } from "./ui";

type NotificationRole = "guest" | "host" | "admin";
type UnreadCountResponse = {
  count?: number;
};
type NotificationSummaryResponse = {
  counts?: Record<string, number>;
};

const UNREAD_COUNT_TTL_MS = 30_000;
const unreadCountCache = new Map<string, { count: number; at: number }>();
const unreadCountInflight = new Map<string, Promise<number>>();
const summaryCache = new Map<string, { counts: Record<string, number>; at: number }>();
const summaryInflight = new Map<string, Promise<Record<string, number>>>();

function unreadCountKey(role: NotificationRole, typesKey: string) {
  return `${role}:${typesKey}`;
}

async function fetchUnreadCount(
  role: NotificationRole,
  types: string[] | undefined,
  typesKey: string,
) {
  const key = unreadCountKey(role, typesKey);
  const cached = unreadCountCache.get(key);
  if (cached && Date.now() - cached.at < UNREAD_COUNT_TTL_MS) {
    return cached.count;
  }

  const existing = unreadCountInflight.get(key);
  if (existing) return existing;

  const request = (async () => {
    const params = new URLSearchParams({ role });
    for (const type of types ?? []) params.append("type", type);
    const res = await fetch(`/api/notifications/unread-count?${params.toString()}`);
    if (!res.ok) throw new Error(`unread-count request failed: ${res.status}`);
    const data = (await res.json()) as UnreadCountResponse;
    const count = data.count ?? 0;
    unreadCountCache.set(key, { count, at: Date.now() });
    return count;
  })();

  unreadCountInflight.set(key, request);

  try {
    return await request;
  } finally {
    unreadCountInflight.delete(key);
  }
}

async function fetchNotificationSummary(role: NotificationRole) {
  const cached = summaryCache.get(role);
  if (cached && Date.now() - cached.at < UNREAD_COUNT_TTL_MS) {
    return cached.counts;
  }

  const existing = summaryInflight.get(role);
  if (existing) return existing;

  const request = (async () => {
    const res = await fetch(`/api/notifications/summary?role=${role}`);
    if (!res.ok) throw new Error(`notification summary request failed: ${res.status}`);
    const data = (await res.json()) as NotificationSummaryResponse;
    const counts = data.counts ?? {};
    summaryCache.set(role, { counts, at: Date.now() });
    if (typeof counts.default === "number") {
      unreadCountCache.set(unreadCountKey(role, ""), {
        count: counts.default,
        at: Date.now(),
      });
    }
    if (typeof counts.kyc === "number") {
      unreadCountCache.set(unreadCountKey(role, "kyc_submitted"), {
        count: counts.kyc,
        at: Date.now(),
      });
    }
    return counts;
  })();

  summaryInflight.set(role, request);
  try {
    return await request;
  } finally {
    summaryInflight.delete(role);
  }
}

export function useNotificationUnreadCount(
  role: NotificationRole,
  types?: string[],
) {
  const typesKey = (types ?? []).join(",");
  const cacheKey = unreadCountKey(role, typesKey);
  const [count, setCount] = useState(() => unreadCountCache.get(cacheKey)?.count ?? 0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const nextCount =
          role === "admin" || !types?.length
            ? (await fetchNotificationSummary(role))[typesKey === "kyc_submitted" ? "kyc" : "default"] ?? 0
            : await fetchUnreadCount(role, types, typesKey);
        if (!cancelled) setCount(nextCount);
      } catch (e) {
        console.error("[notifications:unread-count] failed:", e);
      }
    }

    function handleChanged() {
      unreadCountCache.clear();
      summaryCache.clear();
      void load();
    }

    void load();
    window.addEventListener("notifications:changed", handleChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("notifications:changed", handleChanged);
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
