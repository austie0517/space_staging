import type {
  Space,
  SpaceField,
  SpaceFieldType,
  Availability,
  RepeatType,
} from "@/types";

/**
 * Mock spaces + their DB-managed fields and availability rules. Phase 1 data
 * source — the real reads live in `@/services/supabase`.
 */

export const SAMPLE_SPACES: Space[] = [
  {
    id: "sunset-atelier",
    title: "Sunset Atelier",
    area: "東京都渋谷区・代官山",
    description:
      "自然光が豊かに差し込む、洗練されたクリエイティブワークスペース。高品質な家具と開放的な空間が、あなたのインスピレーションを最大限に引き出します。プロフェッショナルな写真撮影から小規模なワークショップまで、上質な時間をお約束します。",
    pitchTitle: "自然光で作品の質感が引き立つ、代官山の上質なアトリエ",
    pitchBody:
      "大きな窓からやわらかな光が入る、撮影や少人数ワークショップに向いた空間です。家具は移動しやすく、商品撮影、ポートレート、打ち合わせまで用途に合わせて整えられます。",
    resourceCategory: "venue",
    capacityUnit: "person",
    pricePerHour: 3200,
    minBookingHours: 2,
    capacity: 8,
    rating: 4.9,
    reviewCount: 124,
    spaceType: "Creative Studio",
    images: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      "高品質デザインチェア & デスク",
      "ホワイトボード（移動式）",
      "プロジェクター（4K対応）",
      "ネスプレッソ・コーヒーメーカー",
    ],
    wifi: true,
    parking: true,
    published: true,
  },
  {
    id: "minimalist-lab",
    title: "Minimalist Lab",
    area: "東京都港区・神宮前",
    description:
      "都心を一望する高層階のミニマルなラボ。夜景を背景にした撮影や、集中したい少人数のミーティングに最適です。",
    pitchTitle: "眺望と静けさを両立した、高層階のミニマルスペース",
    pitchBody:
      "余白のある内装で、オンライン配信や小規模な商談にも使いやすい個室です。夕方以降は夜景を背景にした撮影にも向いています。",
    resourceCategory: "venue",
    capacityUnit: "person",
    pricePerHour: 2800,
    minBookingHours: 2,
    capacity: 6,
    rating: 4.8,
    reviewCount: 86,
    spaceType: "Private Office",
    images: [
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: ["高速Wi-Fi", "大型モニター", "ホワイトボード"],
    wifi: true,
    parking: false,
    published: true,
  },
  {
    id: "harajuku-hideout",
    title: "Harajuku Hideout",
    area: "東京都渋谷区・神宮前",
    description:
      "本格的なエスプレッソマシンを備えた、カフェスタイルの隠れ家空間。商品撮影やワークショップに人気です。",
    pitchTitle: "カフェの空気感をそのまま使える、原宿の隠れ家スペース",
    pitchBody:
      "ドリンク撮影やライフスタイル系の収録に使いやすい、温かみのある内装です。小さなイベントやブランド向けワークショップにも対応できます。",
    resourceCategory: "venue",
    capacityUnit: "person",
    pricePerHour: 3100,
    minBookingHours: 3,
    capacity: 10,
    rating: 4.7,
    reviewCount: 52,
    spaceType: "Cafe Style",
    images: [
      "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: ["エスプレッソマシン", "撮影用背景紙", "間接照明"],
    wifi: true,
    parking: false,
    published: false, // 設備点検のため一時非公開（監査ログ参照）
  },
];

/** The host's own spaces (single-host demo). */
export const hostSpaces: Space[] = SAMPLE_SPACES;

/* ------------------------------------------------------ space_fields */

export const fieldTypeLabel: Record<SpaceFieldType, string> = {
  text: "テキスト",
  number: "数値",
  boolean: "有無",
  select: "選択",
};

export const sampleSpaceFields: SpaceField[] = [
  { id: "sf-1", spaceId: "sunset-atelier", key: "wifi_speed", label: "Wi-Fi速度", value: "100Mbps", isPublic: true, order: 1, type: "text" },
  { id: "sf-2", spaceId: "sunset-atelier", key: "ceiling_height", label: "天井高", value: "3.2", isPublic: true, order: 2, type: "number" },
  { id: "sf-3", spaceId: "sunset-atelier", key: "floor", label: "床素材", value: "無垢オーク", isPublic: true, order: 3, type: "select", options: ["無垢オーク", "コンクリート", "タイル", "カーペット"] },
  { id: "sf-4", spaceId: "sunset-atelier", key: "smoking", label: "喫煙", value: "false", isPublic: true, order: 4, type: "boolean" },
  { id: "sf-5", spaceId: "sunset-atelier", key: "key_box", label: "キーボックス番号", value: "2024", isPublic: false, order: 5, type: "text" },
  { id: "sf-6", spaceId: "minimalist-lab", key: "view", label: "眺望", value: "都心夜景", isPublic: true, order: 1, type: "text" },
  { id: "sf-7", spaceId: "minimalist-lab", key: "floor_no", label: "階数", value: "32", isPublic: true, order: 2, type: "number" },
  { id: "sf-8", spaceId: "minimalist-lab", key: "soundproof", label: "防音", value: "true", isPublic: true, order: 3, type: "boolean" },
  { id: "sf-9", spaceId: "harajuku-hideout", key: "backdrop", label: "撮影用背景紙", value: "5色", isPublic: true, order: 1, type: "select", options: ["3色", "5色", "10色"] },
  { id: "sf-10", spaceId: "harajuku-hideout", key: "espresso", label: "エスプレッソマシン", value: "true", isPublic: true, order: 2, type: "boolean" },
];

/** All fields for a space, sorted by display order. */
export function fieldsForSpace(spaceId: string): SpaceField[] {
  return sampleSpaceFields
    .filter((f) => f.spaceId === spaceId)
    .sort((a, b) => a.order - b.order);
}

/** Format a field value for display based on its type. */
export function formatFieldValue(field: SpaceField): string {
  if (field.type === "boolean") return field.value === "true" ? "あり" : "なし";
  if (field.type === "number" && field.value) return field.value;
  return field.value || "—";
}

/* ----------------------------------------------------- availabilities */

export const repeatTypeLabel: Record<RepeatType, string> = {
  none: "繰り返しなし",
  daily: "毎日",
  weekly: "毎週",
  monthly: "毎月",
};

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export const sampleAvailabilities: Availability[] = [
  {
    id: "av-1",
    spaceId: "sunset-atelier",
    bookableLevel: "seat",
    startTime: "09:00",
    endTime: "21:00",
    repeatType: "weekly",
    repeatUntil: "2025-03-31",
    daysOfWeek: [1, 2, 3, 4, 5],
    exceptions: ["2025-01-01"],
  },
  {
    id: "av-2",
    spaceId: "sunset-atelier",
    bookableLevel: "space",
    startTime: "10:00",
    endTime: "18:00",
    repeatType: "weekly",
    daysOfWeek: [6, 0],
    exceptions: [],
  },
  {
    id: "av-3",
    spaceId: "minimalist-lab",
    bookableLevel: "both",
    startTime: "08:00",
    endTime: "22:00",
    repeatType: "daily",
    exceptions: ["2025-02-11"],
    daysOfWeek: [],
  },
];

/** Availability rules for a space. */
export function availabilitiesForSpace(spaceId: string): Availability[] {
  return sampleAvailabilities.filter((a) => a.spaceId === spaceId);
}
