"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Icon } from "./ui";
import {
  NotificationUnreadBadge,
  useNotificationUnreadCount,
} from "./NotificationUnreadBadge";

type NavItem = { href: string; label: string; icon: string };

const items: NavItem[] = [
  { href: "/spaces", label: "スペース", icon: "search" },
  { href: "/guest/bookings", label: "予約", icon: "calendar_today" },
  { href: "/me/notifications", label: "通知", icon: "notifications" },
  { href: "/me", label: "マイページ", icon: "person" },
];

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) => {
    if (item.href === "/me") {
      // マイページ = /me and its sub-pages, except /me/notifications (own tab).
      return (
        pathname === "/me" ||
        (pathname.startsWith("/me/") && !pathname.startsWith("/me/notifications"))
      );
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };
}

/**
 * Guest navigation. Mobile: fixed bottom bar (thumb-zone). Desktop (md+): a
 * fixed top app bar. Pages add `md:pt-14` so content clears the top bar.
 */
export function GuestNav() {
  const isActive = useIsActive();
  const unreadCount = useNotificationUnreadCount("guest");

  return (
    <>
      {/* Desktop top bar */}
      <nav className="fixed inset-x-0 top-0 z-50 hidden border-b border-border bg-surface/90 backdrop-blur-md md:block">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/spaces" className="font-display text-lg text-on-surface">
            Zenith Lumina
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
                  {item.href === "/me/notifications" && (
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
                  {item.href === "/me/notifications" && (
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
