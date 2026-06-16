import type { Review } from "@/types";

/**
 * Guest reviews keyed by space — Airbnb-style trust signal shown on the space
 * detail page and written after a `completed` booking.
 */
export const sampleReviews: Review[] = [
  {
    id: "rv-1",
    spaceId: "sunset-atelier",
    authorName: "山本 彩",
    authorAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
    rating: 5,
    body: "自然光が本当に素晴らしく、ポートレート撮影に最高の環境でした。設備も清潔でホストの対応も丁寧。また利用します。",
    createdAt: "2024年10月",
  },
  {
    id: "rv-2",
    spaceId: "sunset-atelier",
    authorName: "Daniel R.",
    authorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    rating: 5,
    body: "Spacious, bright, and beautifully designed. Perfect for our small workshop. Highly recommended.",
    createdAt: "2024年9月",
  },
  {
    id: "rv-3",
    spaceId: "sunset-atelier",
    authorName: "中村 大輔",
    authorAvatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    rating: 4,
    body: "立地もよく快適でした。コーヒーマシンが嬉しいポイント。強いて言えば駐車場がもう少し近いと完璧でした。",
    createdAt: "2024年8月",
  },
  {
    id: "rv-4",
    spaceId: "minimalist-lab",
    authorName: "佐々木 玲奈",
    authorAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
    rating: 5,
    body: "夜景が綺麗で、集中して作業できました。ミニマルな内装が写真映えします。",
    createdAt: "2024年10月",
  },
  {
    id: "rv-5",
    spaceId: "harajuku-hideout",
    authorName: "高橋 翔",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    rating: 5,
    body: "商品撮影で利用。背景紙と照明が揃っていて準備が楽でした。エスプレッソも美味しい。",
    createdAt: "2024年9月",
  },
];

/** Reviews for a single space, newest first (sample order). */
export function reviewsForSpace(spaceId: string): Review[] {
  return sampleReviews.filter((r) => r.spaceId === spaceId);
}
