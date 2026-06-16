"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Icon } from "./ui";
import {
  NotificationUnreadBadge,
  useNotificationUnreadCount,
} from "./NotificationUnreadBadge";

type NavItem = { label: string; icon: string; href: string };

const items: NavItem[] = [
  { label: "スペース", icon: "storefront", href: "/host/spaces" },
  { label: "予約", icon: "event_note", href: "/host/bookings" },
  { label: "収益", icon: "payments", href: "/host/earnings" },
  { label: "通知", icon: "notifications", href: "/host/notifications" },
  { label: "マイページ", icon: "person", href: "/host/me" },
];

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Host navigation. Mobile: fixed bottom bar. Desktop (md+): fixed top app bar.
 * Host pages add `md:pt-14` so content clears the top bar.
 */
export function HostNav() {
  const isActive = useIsActive();
  const unreadCount = useNotificationUnreadCount("host");

  return (
    <>
      {/* Desktop top bar */}
      <nav className="fixed inset-x-0 top-0 z-50 hidden border-b border-border bg-surface/90 backdrop-blur-md md:block">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/host/spaces" className="font-display text-lg text-primary">
            Zenith Lumina{" "}
            <span className="text-sm text-on-surface-variant">Host</span>
          </Link>
          <div className="flex items-center gap-1">
            {items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary-container text-on-primary-container"
                      : "text-on-surface-variant hover:bg-surface-low",
                  )}
                >
                  <Icon name={item.icon} filled={active} className="text-[20px]" />
                  {item.label}
                  {item.href === "/host/notifications" && (
                    <NotificationUnreadBadge
                      count={unreadCount}
                      className="absolute -right-1 -top-1"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-1 py-1"
              >
                <span
                  className={cn(
                    "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary-container",
                  )}
                >
                  <Icon
                    name={item.icon}
                    filled={active}
                    className={cn(
                      "text-[22px]",
                      active ? "text-on-primary-container" : "text-secondary",
                    )}
                  />
                  {item.href === "/host/notifications" && (
                    <NotificationUnreadBadge
                      count={unreadCount}
                      className="absolute -right-1 -top-1"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    active ? "text-on-surface" : "text-secondary",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
