import Link from "next/link";
import { Icon } from "../_components/ui";

const roles = [
  {
    href: "/signup/guest",
    icon: "content_cut",
    title: "施術者として登録",
    desc: "スペースを借りて施術・撮影を行う",
  },
  {
    href: "/signup/host",
    icon: "store",
    title: "ホストとして登録",
    desc: "自分のスペースを貸し出す",
  },
];

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-low px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-surface-card p-8 shadow-soft">
        <div className="text-center">
          <h1 className="font-display text-3xl text-primary">新規登録</h1>
          <p className="mt-2 text-on-surface-variant">登録する種別を選んでください</p>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {roles.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary-container"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/30">
                <Icon name={r.icon} className="text-primary" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-on-surface">{r.title}</span>
                <span className="text-sm text-on-surface-variant">{r.desc}</span>
              </span>
              <Icon name="arrow_forward" className="text-on-surface-variant" />
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-on-surface-variant">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="text-primary hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
