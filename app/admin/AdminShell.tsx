"use client";

import Link from "next/link";
import { Icon } from "../_components/ui";
import { SubNav, ADMIN_NAV } from "../_components/SubNav";
import { useAdmin } from "./AdminContext";

/** Shared chrome for every /admin route: title, persistent pending banner, sub-nav. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pendingCount } = useAdmin();

  return (
    <div className="min-h-screen pb-12">
      <header className="flex items-center justify-between px-5 pb-2 pt-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Admin
          </p>
          <h1 className="font-display text-3xl text-on-surface">管理者ダッシュボード</h1>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icon name="shield_person" />
        </span>
      </header>

      {/* Persistent across all admin tabs — disappears once every application is actioned. */}
      {pendingCount > 0 && (
        <div className="px-5 py-4">
          <Link
            href="/admin"
            className="flex items-center gap-4 rounded-xl border border-border bg-surface-card p-5 shadow-card transition-colors hover:bg-surface-low"
          >
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary-container/40">
              <Icon name="assignment" className="text-primary" />
            </span>
            <div className="flex-1">
              <p className="text-sm text-on-surface-variant">保留中の審査</p>
              <p className="font-display text-3xl text-on-surface">
                {pendingCount}
                <span className="ml-1 text-base">件の要対応</span>
              </p>
            </div>
            <span className="flex flex-none items-center gap-1 text-sm font-semibold text-primary">
              審査する
              <Icon name="arrow_forward" className="text-[18px]" />
            </span>
          </Link>
        </div>
      )}

      <div className="mt-2">
        <SubNav items={ADMIN_NAV} />
      </div>

      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>
    </div>
  );
}
