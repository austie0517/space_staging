"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Icon, cn } from "../_components/ui";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPw, setShowPw] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-low px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-surface-card p-8 shadow-soft">
        <div className="text-center">
          <h1 className="font-display text-4xl text-primary">Zenith Lumina</h1>
          <p className="mt-2 text-on-surface-variant">
            創造性を解き放つ静かな仕事空間
          </p>
        </div>

        {/* Segmented tabs */}
        <div className="mt-7 grid grid-cols-2 gap-1 rounded-lg bg-surface-high p-1">
          <button
            onClick={() => setTab("login")}
            className={cn(
              "rounded-md py-2.5 text-sm font-bold transition-colors",
              tab === "login"
                ? "bg-surface-card text-primary shadow-card"
                : "text-on-surface-variant",
            )}
          >
            ログイン
          </button>
          <button
            onClick={() => setTab("signup")}
            className={cn(
              "rounded-md py-2.5 text-sm font-bold transition-colors",
              tab === "signup"
                ? "bg-surface-card text-primary shadow-card"
                : "text-on-surface-variant",
            )}
          >
            新規登録
          </button>
        </div>

        {tab === "login" ? (
          <form
            className="mt-7 flex flex-col gap-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-on-surface">
                メールアドレス
              </span>
              <input
                type="email"
                placeholder="name@example.com"
                className="rounded-lg border border-border bg-surface px-4 py-3 outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-on-surface">
                パスワード
              </span>
              <div className="flex items-center rounded-lg border border-border bg-surface px-4 transition-colors focus-within:border-primary">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-on-surface-variant"
                  aria-label="パスワード表示切替"
                >
                  <Icon name={showPw ? "visibility_off" : "visibility"} />
                </button>
              </div>
            </label>

            <div className="text-right">
              <a href="#" className="text-sm text-primary hover:underline">
                パスワードを忘れた場合
              </a>
            </div>

            <Button type="submit" size="lg" fullWidth>
              ログイン
            </Button>

            <Divider />
            <SocialButtons />
          </form>
        ) : (
          <div className="mt-7 flex flex-col gap-4">
            <p className="text-center text-sm text-on-surface-variant">
              登録する種別を選んでください
            </p>
            <Link
              href="/signup/guest"
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary-container"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/30">
                <Icon name="content_cut" className="text-primary" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-on-surface">
                  施術者として登録
                </span>
                <span className="text-sm text-on-surface-variant">
                  スペースを借りて施術・撮影を行う
                </span>
              </span>
              <Icon name="arrow_forward" className="text-on-surface-variant" />
            </Link>
            <Link
              href="/signup/host"
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary-container"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/30">
                <Icon name="store" className="text-primary" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-on-surface">
                  ホストとして登録
                </span>
                <span className="text-sm text-on-surface-variant">
                  自分のスペースを貸し出す
                </span>
              </span>
              <Icon name="arrow_forward" className="text-on-surface-variant" />
            </Link>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-5 text-xs text-on-surface-variant">
          <a href="#" className="hover:underline">利用規約</a>
          <a href="#" className="hover:underline">プライバシーポリシー</a>
          <a href="#" className="hover:underline">特定商取引法</a>
        </div>
      </div>
    </main>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-sm text-on-surface-variant">
      <span className="h-px flex-1 bg-border" />
      または
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-card py-3 font-medium transition-colors hover:bg-surface-low"
      >
        <span className="text-lg font-bold text-[#4285F4]">G</span> Google
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-card py-3 font-medium transition-colors hover:bg-surface-low"
      >
        <Icon name="apple" /> Apple
      </button>
    </div>
  );
}
