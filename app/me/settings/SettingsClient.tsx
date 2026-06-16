"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, Toast, cn } from "../../_components/ui";
import { lineNotificationLabel, lineNotificationKeys } from "@/mock";
import type { LineConnection, LineNotificationKey } from "@/types";
import {
  connectLineAction,
  disconnectLineAction,
  setLineNotifAction,
} from "./actions";

export function SettingsClient({ initial }: { initial: LineConnection }) {
  const router = useRouter();
  const back = () => router.push("/me?tab=profile");

  const [line, setLine] = useState<LineConnection>(initial);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  const connect = async () => {
    setLine((prev) => ({ ...prev, connected: true })); // optimistic
    const res = await connectLineAction();
    if (res.ok) flash("LINEと連携しました");
    else {
      setLine((prev) => ({ ...prev, connected: false }));
      flash(res.error);
    }
  };

  const disconnect = async () => {
    setLine((prev) => ({ ...prev, connected: false, displayName: undefined }));
    const res = await disconnectLineAction();
    if (res.ok) flash("LINE連携を解除しました");
    else flash(res.error);
  };

  const toggle = async (key: LineNotificationKey) => {
    const next = !line.notifications[key];
    setLine((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: next },
    }));
    const res = await setLineNotifAction(key, next);
    if (!res.ok) {
      setLine((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: !next },
      }));
      flash(res.error);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-surface/80 px-3 backdrop-blur-md">
        <button
          onClick={back}
          aria-label="戻る"
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-low"
        >
          <Icon name="arrow_back" />
        </button>
        <h1 className="font-display text-xl text-on-surface">通知・LINE連携</h1>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-6">
        {/* LINE connection */}
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#06C755]/15">
              <Icon name="chat" className="text-[#06C755]" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-on-surface">LINE連携</p>
              <p className="text-sm text-on-surface-variant">
                {line.connected
                  ? `連携済み${line.displayName ? `：${line.displayName}` : ""}`
                  : "予約確定・入室PINをLINEで受け取れます"}
              </p>
            </div>
            {line.connected && <Badge tone="success">連携中</Badge>}
          </div>
          <div className="mt-4">
            {line.connected ? (
              <Button variant="secondary" fullWidth onClick={disconnect}>
                連携を解除する
              </Button>
            ) : (
              <Button fullWidth onClick={connect}>
                <Icon name="link" className="text-[18px]" /> LINEと連携する
              </Button>
            )}
          </div>
        </div>

        {/* Notification toggles */}
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <h2 className="mb-1 font-display text-lg text-on-surface">通知の種類</h2>
          <p className="mb-3 text-sm text-on-surface-variant">
            受け取る通知を選べます{line.connected ? "" : "（LINE連携後に有効）"}。
          </p>
          <div className="flex flex-col divide-y divide-border">
            {lineNotificationKeys.map((key) => (
              <div key={key} className="flex items-center justify-between py-3">
                <span
                  className={cn(
                    "text-on-surface",
                    !line.connected && "text-on-surface-variant/50",
                  )}
                >
                  {lineNotificationLabel[key]}
                </span>
                <ToggleSwitch
                  checked={line.notifications[key]}
                  disabled={!line.connected}
                  onChange={() => toggle(key)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <Toast show={toast !== null} message={toast ?? ""} />
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 flex-none rounded-full transition-colors disabled:opacity-40",
        checked ? "bg-primary" : "bg-surface-high",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
