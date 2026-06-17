"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, cn } from "../../_components/ui";
import { AdminShell } from "../AdminShell";
import { userStatusLabel } from "@/mock";
import type { AdminUser } from "@/types";
import { setUserStatusAction } from "../actions";

const roleLabel: Record<AdminUser["role"], string> = {
  guest: "施術者",
  host: "ホスト",
  admin: "管理者",
};

const statusTone: Record<AdminUser["status"], "success" | "warning" | "neutral"> = {
  active: "success",
  pending: "warning",
  suspended: "neutral",
};

type Filter = "all" | AdminUser["status"];

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "pending", label: "審査中" },
  { key: "active", label: "有効" },
  { key: "suspended", label: "停止中" },
];

export function AdminUsersClient({
  users: initialUsers,
  total,
  page,
  pageSize,
}: {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const visible =
    filter === "all" ? users : users.filter((u) => u.status === filter);

  const setStatus = (id: string, status: AdminUser["status"]) =>
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status } : u)),
    );

  const toggleStatus = async (u: AdminUser) => {
    const next = u.status === "suspended" ? "active" : "suspended";
    setStatus(u.id, next); // optimistic
    const res = await setUserStatusAction(u.id, next);
    if (res.ok) startTransition(() => router.refresh());
    else setStatus(u.id, u.status);
  };

  return (
    <AdminShell>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        ユーザー（{total}件中 {visible.length}件表示・{page} / {Math.max(1, Math.ceil(total / pageSize))}ページ）
      </h2>

      {/* Status filter */}
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? users.length
              : users.filter((u) => u.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex-none rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                filter === f.key
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface-card text-on-surface-variant",
              )}
            >
              {f.label}（{count}）
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-card">
        {visible.length === 0 && (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            この状態のユーザーはいません。
          </p>
        )}
        {visible.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3 border-b border-border p-4 last:border-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u.avatar}
              alt={u.name}
              className="h-11 w-11 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-on-surface">{u.name}</p>
                <Badge tone={u.role === "host" ? "primary" : "neutral"}>
                  {roleLabel[u.role]}
                </Badge>
              </div>
              <p className="text-sm text-on-surface-variant">{u.email}</p>
              <button
                type="button"
                onClick={() => setSelectedUser(u)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                プロフィールを見る
                <Icon name="chevron_right" className="text-[18px]" />
              </button>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge tone={statusTone[u.status]}>{userStatusLabel[u.status]}</Badge>
              <p className="text-xs text-on-surface-variant">{u.joinedAt}〜</p>
              {u.role !== "admin" && (
                <Button
                  variant={u.status === "suspended" ? "secondary" : "danger"}
                  size="sm"
                  onClick={() => toggleStatus(u)}
                >
                  {u.status === "suspended" ? "利用再開" : "利用停止"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedUser && (
        <UserProfileDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </AdminShell>
  );
}

function UserProfileDialog({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        aria-label="プロフィールを閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/45 backdrop-blur-sm"
      />
      <div className="relative z-10 flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-surface-card shadow-[var(--shadow-soft)] md:rounded-2xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar}
              alt={user.name}
              className="h-16 w-16 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl text-on-surface">{user.name}</h3>
                <Badge tone={user.role === "host" ? "primary" : "neutral"}>
                  {roleLabel[user.role]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-low"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto px-5 py-5 md:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-xl border border-border bg-surface-low p-4">
            <h4 className="font-display text-lg text-on-surface">基本情報</h4>
            <dl className="mt-3 flex flex-col divide-y divide-border text-sm">
              <ProfileRow label="名前" value={user.name} />
              <ProfileRow label="メール" value={user.email} />
              <ProfileRow label="電話番号" value={user.phone || "未設定"} />
              <ProfileRow label="アカウント状態" value={userStatusLabel[user.status]} />
              <ProfileRow label="登録日" value={user.joinedAt} />
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-surface-low p-4">
            <h4 className="font-display text-lg text-on-surface">利用者属性</h4>
            <dl className="mt-3 flex flex-col divide-y divide-border text-sm">
              <ProfileRow label="本人確認" value={kycLabel(user.kycStatus)} />
              <ProfileRow label="職種" value={user.profession || "未設定"} />
              <ProfileRow label="資格" value={user.license || "未設定"} />
              <ProfileRow label="ホストプラン" value={user.plan || "未設定"} />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-right font-semibold text-on-surface">{value}</dd>
    </div>
  );
}

function kycLabel(status?: AdminUser["kycStatus"]) {
  switch (status) {
    case "approved":
      return "承認済み";
    case "pending":
      return "審査中";
    case "rejected":
      return "差し戻し";
    default:
      return "未提出";
  }
}
