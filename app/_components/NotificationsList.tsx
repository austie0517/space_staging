"use client";

import { useState } from "react";
import type { Notification, NotificationType } from "@/types";
import { Icon, cn } from "./ui";

type NotificationRole = "guest" | "host" | "admin";

export function NotificationsList({
  notifications,
  role,
  showSales = true,
  hiddenTypes = [],
}: {
  notifications: Notification[];
  role: NotificationRole;
  showSales?: boolean;
  hiddenTypes?: NotificationType[];
}) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState(notifications);
  const [reading, setReading] = useState(false);
  const scopedNotifications = showSales
    ? items
    : items.filter((n) => n.category !== "売上");
  const visibleNotifications = scopedNotifications.filter(
    (n) => !hiddenTypes.includes(n.type),
  );
  const unread = visibleNotifications.filter((n) => n.unread).length;
  const list = unreadOnly
    ? visibleNotifications.filter((n) => n.unread)
    : visibleNotifications;
  const unreadIds = visibleNotifications.filter((n) => n.unread).map((n) => n.id);

  async function markRead(ids: string[]) {
    if (ids.length === 0 || reading) return;
    setReading(true);
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ids }),
      });
      if (!res.ok) return;
      setItems((current) =>
        current.map((item) =>
          ids.includes(item.id) ? { ...item, unread: false } : item,
        ),
      );
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (e) {
      console.error("[notifications:mark-read] failed:", e);
    } finally {
      setReading(false);
    }
  }

  return (
    <>
      <header className="px-5 pb-3 pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl text-on-surface">通知</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              未読 {unread}件 / 全{visibleNotifications.length}件
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-none sm:justify-end">
            {unreadIds.length > 0 && (
              <button
                type="button"
                onClick={() => void markRead(unreadIds)}
                disabled={reading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-low disabled:opacity-50"
              >
                <Icon name="done_all" className="text-[18px]" />
                すべて既読
              </button>
            )}
            <button
              type="button"
              onClick={() => setUnreadOnly((value) => !value)}
              aria-pressed={unreadOnly}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors",
                unreadOnly
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface-card text-on-surface-variant",
              )}
            >
              <Icon
                name={unreadOnly ? "mark_email_unread" : "inbox"}
                className="text-[18px]"
              />
              未読のみ
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Icon
              name="mark_email_read"
              className="text-[32px] text-on-surface-variant/50"
            />
            <p className="text-sm text-on-surface-variant">
              通知はありません。
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((n) => (
              <NotificationCard
                key={n.id}
                n={n}
                disabled={reading}
                onRead={() => void markRead([n.id])}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function NotificationCard({
  n,
  disabled,
  onRead,
}: {
  n: Notification;
  disabled: boolean;
  onRead: () => void;
}) {
  return (
    <div
      className={`flex gap-3 rounded-lg border p-4 transition-colors ${
        n.unread
          ? "border-primary-container/60 bg-primary-container/10"
          : "border-border bg-surface-card"
      }`}
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-container/30">
        <Icon name={n.icon} className="text-[20px] text-primary" />
      </span>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 inline-flex rounded-md bg-surface-low px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
              {n.category}
            </div>
            <p className="font-semibold leading-snug text-on-surface">
              {n.title}
            </p>
          </div>
          {n.unread && (
            <div className="flex flex-none items-center gap-2">
              <button
                type="button"
                onClick={onRead}
                disabled={disabled}
                className="rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-container/20 disabled:opacity-50"
              >
                既読にする
              </button>
              <span className="h-2 w-2 rounded-full bg-primary" />
            </div>
          )}
        </div>
        <p className="mt-0.5 text-sm text-on-surface-variant">{n.body}</p>
        <p className="mt-1 text-xs text-on-surface-variant/70">{n.time}</p>
      </div>
    </div>
  );
}
