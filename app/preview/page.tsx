import Link from "next/link";
import { Icon } from "../_components/ui";

const groups = [
  {
    title: "ゲスト（施術者）",
    items: [
      { href: "/spaces", label: "スペース検索・一覧", icon: "search" },
      { href: "/spaces/sunset-atelier", label: "スペース詳細 ＋ 予約Dialog", icon: "storefront" },
      { href: "/me", label: "マイページ（予約履歴・プロフィール）", icon: "person" },
      { href: "/guest/bookings", label: "予約一覧", icon: "event_note" },
      { href: "/me/notifications", label: "通知", icon: "notifications" },
    ],
  },
  {
    title: "ホスト",
    items: [
      { href: "/host/dashboard", label: "ダッシュボード", icon: "dashboard" },
      { href: "/host/spaces", label: "スペース一覧", icon: "storefront" },
      { href: "/host/spaces/new", label: "スペース登録（ステッパー）", icon: "add_business" },
      { href: "/host/spaces/sunset-atelier", label: "スペース管理（概要/カレンダー/設定）", icon: "tune" },
      { href: "/host/bookings", label: "予約管理（承認）", icon: "event_available" },
      { href: "/host/calendar", label: "カレンダー", icon: "calendar_month" },
    ],
  },
  {
    title: "認証",
    items: [
      { href: "/login", label: "ログイン", icon: "login" },
      { href: "/signup", label: "新規登録（種別選択）", icon: "person_add" },
      { href: "/signup/guest", label: "施術者 新規登録", icon: "how_to_reg" },
      { href: "/signup/host", label: "ホスト 新規登録", icon: "store" },
    ],
  },
  {
    title: "管理",
    items: [
      { href: "/admin", label: "審査", icon: "shield_person" },
      { href: "/admin/spaces", label: "スペース管理", icon: "apartment" },
      { href: "/admin/users", label: "ユーザー管理", icon: "group" },
      { href: "/admin/bookings", label: "予約管理", icon: "event_note" },
      { href: "/admin/settlements", label: "精算", icon: "account_balance" },
    ],
  },
];

export default function PreviewPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-widest text-primary">
        Zenith Lumina
      </p>
      <h1 className="mt-2 font-display text-4xl text-on-surface">UIプレビュー</h1>
      <p className="mt-3 max-w-prose leading-relaxed text-on-surface-variant">
        サンプルデータ（ホスト：田中 芳子 / ゲスト：佐藤 健太）で全画面を表示します。
        各リンクから移動して確認してください。決済（Stripe Webhook）は
        <code className="mx-1 rounded bg-surface-high px-1.5 py-0.5 text-sm">
          /api/stripe/webhook
        </code>
        にスタブを用意済みです。
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-4 font-display text-2xl text-on-surface">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-surface-card p-4 shadow-card transition-all hover:border-primary-container hover:shadow-soft"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary-container/30">
                    <Icon name={item.icon} className="text-[22px] text-primary" />
                  </span>
                  <span className="flex-1 font-semibold text-on-surface">
                    {item.label}
                  </span>
                  <Icon
                    name="arrow_forward"
                    className="text-on-surface-variant transition-transform group-hover:translate-x-1"
                  />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
