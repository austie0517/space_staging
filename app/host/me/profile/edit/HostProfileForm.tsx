"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, Toast } from "../../../../_components/ui";
import { sampleHost } from "@/lib/sampleData";
import { updateHostProfileAction, uploadHostAvatarAction } from "../../actions";
import {
  buildFullAddress,
  fetchAddressByZip,
  fetchLatLng,
  formatZipcode,
} from "@/lib/address";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export function HostProfileForm({
  initial,
}: {
  initial: {
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    zipcode: string;
    prefecture: string;
    city: string;
    town: string;
    building: string;
  };
}) {
  const router = useRouter();
  const back = () => router.push("/host/me");

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [avatar, setAvatar] = useState(initial.avatarUrl);
  const [zipcode, setZipcode] = useState(initial.zipcode);
  const [prefecture, setPrefecture] = useState(initial.prefecture);
  const [city, setCity] = useState(initial.city);
  const [town, setTown] = useState(initial.town);
  const [building, setBuilding] = useState(initial.building);
  const [addressLookupStatus, setAddressLookupStatus] = useState<
    "idle" | "loading" | "found" | "notFound"
  >("idle");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) {
      setError("写真は5MB以下の画像を選択してください。");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadHostAvatarAction(fd);
    setUploading(false);
    if (res.ok) setAvatar(res.url);
    else setError(res.error);
  };

  const handleZipcodeChange = async (value: string) => {
    const formatted = formatZipcode(value);
    setZipcode(formatted);
    if (formatted.replace("-", "").length !== 7) {
      setAddressLookupStatus("idle");
      return;
    }

    setAddressLookupStatus("loading");
    const addr = await fetchAddressByZip(formatted);
    if (!addr) {
      setAddressLookupStatus("notFound");
      return;
    }
    setPrefecture(addr.prefecture);
    setCity(addr.city);
    setTown(addr.town);
    setAddressLookupStatus("found");
  };

  const save = async () => {
    if (saved || saving) return;
    setSaving(true);
    setError(null);
    const coords = await fetchLatLng(
      buildFullAddress({ prefecture, city, town, building }),
    );
    const res = await updateHostProfileAction({
      name,
      email,
      phone,
      zipcode,
      prefecture,
      city,
      town,
      building,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
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
            src={avatar || sampleHost.avatar}
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
              placeholder="03-1234-5678"
              className="profile-input"
            />
          </Field>
          <div className="rounded-xl border border-border bg-surface-card p-5">
            <h2 className="mb-4 font-display text-lg text-on-surface">住所</h2>
            <div className="flex flex-col gap-4">
              <Field label="郵便番号">
                <input
                  value={zipcode}
                  onChange={(e) => {
                    void handleZipcodeChange(e.target.value);
                  }}
                  placeholder="123-4567"
                  className="profile-input"
                />
                {addressLookupStatus !== "idle" && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {addressLookupStatus === "loading" && "住所を検索中..."}
                    {addressLookupStatus === "found" && "住所を自動入力しました。"}
                    {addressLookupStatus === "notFound" && "住所が見つかりませんでした。"}
                  </p>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="都道府県">
                  <input
                    value={prefecture}
                    readOnly
                    placeholder="東京都"
                    className="profile-input bg-surface-low text-on-surface-variant"
                  />
                </Field>
                <Field label="市区町村">
                  <input
                    value={city}
                    readOnly
                    placeholder="渋谷区"
                    className="profile-input bg-surface-low text-on-surface-variant"
                  />
                </Field>
              </div>
              <Field label="番地">
                <input
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="道玄坂1-2-3"
                  className="profile-input"
                />
              </Field>
              <Field label="建物名・部屋番号">
                <input
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="○○ビル3F"
                  className="profile-input"
                />
              </Field>
            </div>
          </div>
        </div>
      </main>

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
