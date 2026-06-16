"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, Toast } from "../../../_components/ui";
import { sampleGuest } from "@/mock";
import { updateProfileAction, uploadAvatarAction } from "./actions";

/**
 * Guest profile edit form. Persists name/email/profession to Supabase via a
 * server action. `license` and avatar are not modeled in the DB yet, so they
 * stay display-only (mock) for now.
 */
export function ProfileEditForm({
  initial,
}: {
  initial: {
    name: string;
    email: string;
    phone: string;
    profession: string;
    license: string;
    avatarUrl: string;
  };
}) {
  const router = useRouter();
  const back = () => router.push("/me?tab=profile");

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [profession, setProfession] = useState(initial.profession);
  const [license, setLicense] = useState(initial.license);
  const [avatar, setAvatar] = useState(initial.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadAvatarAction(fd);
    setUploading(false);
    if (res.ok) setAvatar(res.url);
    else setError(res.error);
  };

  const save = async () => {
    if (saved || saving) return;
    setSaving(true);
    setError(null);
    const res = await updateProfileAction({
      name,
      email,
      phone,
      profession,
      license,
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(back, 1100);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen pb-28">
      {/* App bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-surface/80 px-3 backdrop-blur-md">
        <button
          onClick={back}
          aria-label="戻る"
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-low"
        >
          <Icon name="arrow_back" />
        </button>
        <h1 className="font-display text-xl text-on-surface">プロフィール編集</h1>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar || sampleGuest.avatar}
            alt={name}
            className="h-24 w-24 rounded-full object-cover"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickPhoto}
            className="sr-only"
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="photo_camera" className="text-[18px]" />
            {uploading ? "アップロード中..." : "写真を変更"}
          </Button>
        </div>

        {/* Fields */}
        <div className="mt-6 flex flex-col gap-5">
          <Field label="お名前">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="profile-input"
            />
          </Field>
          <Field label="メール">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="profile-input"
            />
          </Field>
          <Field label="電話番号">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="090-1234-5678"
              className="profile-input"
            />
          </Field>
          <Field label="職種">
            <input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="profile-input"
            />
          </Field>
          <Field label="保有資格">
            <input
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              className="profile-input"
            />
          </Field>
        </div>
      </main>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 px-5 py-3">
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-error">
              <Icon name="error" className="text-[18px]" />
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-none whitespace-nowrap"
              onClick={back}
              disabled={saved || saving}
            >
              キャンセル
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={!name.trim() || saved || saving}
              onClick={save}
            >
              {saved ? (
                <>
                  <Icon name="check" className="text-[20px]" /> 保存しました
                </>
              ) : saving ? (
                "保存中..."
              ) : (
                "変更を保存"
              )}
            </Button>
          </div>
        </div>
      </div>

      <Toast show={saved} message="プロフィールを更新しました" />

      <style>{`
        .profile-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          padding: 0.65rem 0.9rem;
          font-size: 15px;
          outline: none;
        }
        .profile-input:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}
