"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./ui";
import {
  NotificationUnreadBadge,
  useNotificationUnreadCount,
} from "./NotificationUnreadBadge";

export type SubNavItem = { href: string; label: string };

/** Horizontal scrollable underline link-tabs for section sub-navigation. */
export function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = usePathname();
  const unreadCount = useNotificationUnreadCount("admin");
  const kycUnreadCount = useNotificationUnreadCount("admin", ["kyc_submitted"]);

  return (
    <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-border px-5">
      {items.map((item) => {
        // Exact match for index routes; prefix match for deeper ones.
        const active =
          pathname === item.href ||
          (item.href !== items[0]?.href && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-none items-center gap-1 py-3 text-[15px] font-semibold transition-colors",
              active
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {item.label}
            {item.href === "/admin/kyc" && (
              <NotificationUnreadBadge count={kycUnreadCount} />
            )}
            {item.href === "/admin/notifications" && (
              <NotificationUnreadBadge count={unreadCount} />
            )}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

export const ADMIN_NAV: SubNavItem[] = [
  { href: "/admin", label: "審査" },
  { href: "/admin/spaces", label: "スペース" },
  { href: "/admin/users", label: "ユーザー" },
  { href: "/admin/bookings", label: "予約" },
  { href: "/admin/kyc", label: "本人確認" },
  { href: "/admin/settlements", label: "精算" },
  { href: "/admin/notifications", label: "通知" },
  { href: "/admin/logs", label: "監査ログ" },
];
