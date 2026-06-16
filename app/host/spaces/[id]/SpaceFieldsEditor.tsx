"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, cn } from "../../../_components/ui";
import {
  fieldTypeLabel,
  formatFieldValue,
  type SpaceField,
  type SpaceFieldType,
} from "@/lib/sampleData";
import {
  addSpaceFieldAction,
  deleteSpaceFieldAction,
  setSpaceFieldPublicAction,
  moveSpaceFieldAction,
} from "./actions";

/**
 * Host editor for DB-managed display fields (space_fields). Reads initial
 * fields from the server; add / delete / toggle-public / reorder persist via
 * server actions and refresh the route.
 */
export function SpaceFieldsEditor({
  spaceId,
  initial,
}: {
  spaceId: string;
  initial: SpaceField[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  const add = async (draft: Omit<SpaceField, "id" | "spaceId" | "order">) => {
    const res = await addSpaceFieldAction({ spaceId, ...draft });
    if (res.ok) {
      setAdding(false);
      refresh();
    }
  };

  const remove = async (id: string) => {
    const res = await deleteSpaceFieldAction(id, spaceId);
    if (res.ok) refresh();
  };

  const togglePublic = async (id: string, isPublic: boolean) => {
    const res = await setSpaceFieldPublicAction(id, spaceId, isPublic);
    if (res.ok) refresh();
  };

  const move = async (id: string, dir: -1 | 1) => {
    const res = await moveSpaceFieldAction(spaceId, id, dir);
    if (res.ok) refresh();
  };

  return (
    <div className="rounded-xl border border-border bg-surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-on-surface">表示項目</h3>
          <p className="text-sm text-on-surface-variant">
            ゲストに見せる項目を自由に追加・並べ替えできます。
          </p>
        </div>
        <Button
          size="sm"
          className="flex-none whitespace-nowrap"
          onClick={() => setAdding((v) => !v)}
        >
          <Icon name={adding ? "close" : "add"} className="text-[18px]" />
          {adding ? "閉じる" : "追加"}
        </Button>
      </div>

      {adding && <AddFieldForm onAdd={add} />}

      <ul className={cn("mt-4 flex flex-col gap-2", pending && "opacity-60")}>
        {initial.length === 0 && (
          <li className="rounded-lg bg-surface-low p-4 text-sm text-on-surface-variant">
            まだ項目がありません。「項目を追加」から登録してください。
          </li>
        )}
        {initial.map((f, i) => (
          <li
            key={f.id}
            className="rounded-lg border border-border bg-surface p-3"
          >
            <div className="flex items-start gap-2">
              {/* Reorder */}
              <div className="flex flex-none flex-col">
                <IconBtn
                  name="keyboard_arrow_up"
                  disabled={i === 0}
                  onClick={() => move(f.id, -1)}
                />
                <IconBtn
                  name="keyboard_arrow_down"
                  disabled={i === initial.length - 1}
                  onClick={() => move(f.id, 1)}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-on-surface">{f.label}</span>
                  <Badge tone="neutral">{fieldTypeLabel[f.type]}</Badge>
                  {!f.isPublic && <Badge tone="warning">非公開</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  {formatFieldValue(f)}
                </p>
              </div>

              {/* Public toggle */}
              <button
                type="button"
                onClick={() => togglePublic(f.id, !f.isPublic)}
                aria-label={f.isPublic ? "公開中" : "非公開"}
                className={cn(
                  "flex h-9 w-9 flex-none items-center justify-center rounded-full transition-colors",
                  f.isPublic
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-low text-on-surface-variant",
                )}
              >
                <Icon
                  name={f.isPublic ? "visibility" : "visibility_off"}
                  className="text-[20px]"
                />
              </button>

              <IconBtn
                name="delete"
                onClick={() => remove(f.id)}
                className="text-error"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddFieldForm({
  onAdd,
}: {
  onAdd: (draft: Omit<SpaceField, "id" | "spaceId" | "order">) => void;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<SpaceFieldType>("text");
  const [isPublic, setIsPublic] = useState(true);

  const types: SpaceFieldType[] = ["text", "number", "boolean", "select"];

  const submit = () => {
    if (!label.trim()) return;
    const v = type === "boolean" ? (value === "true" ? "true" : "false") : value.trim();
    onAdd({ key: label.trim(), label: label.trim(), value: v, isPublic, type });
  };

  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-surface-low p-4">
      <div className="flex flex-col gap-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="項目名（例: 天井高）"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[15px] outline-none focus:border-primary"
        />

        {/* Type chips */}
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                type === t
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-on-surface",
              )}
            >
              {fieldTypeLabel[t]}
            </button>
          ))}
        </div>

        {/* Value input varies by type */}
        {type === "boolean" ? (
          <label className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
            <span className="text-sm text-on-surface">値：あり</span>
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => setValue(e.target.checked ? "true" : "false")}
              className="accent-[var(--color-primary)]"
            />
          </label>
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type={type === "number" ? "number" : "text"}
            placeholder={type === "select" ? "値（例: 無垢オーク）" : "値"}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[15px] outline-none focus:border-primary"
          />
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            ゲストに公開する
          </label>
          <Button size="sm" disabled={!label.trim()} onClick={submit}>
            追加
          </Button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  name,
  onClick,
  disabled,
  className,
}: {
  name: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 flex-none items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-low disabled:opacity-30",
        className,
      )}
    >
      <Icon name={name} className="text-[20px]" />
    </button>
  );
}
