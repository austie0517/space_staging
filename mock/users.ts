import type { Host, Guest, AdminUser, Application } from "@/types";

/** Shared avatar URLs reused across mock users / bookings / applications. */
export const AVATAR_HOST =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80";
export const AVATAR_GUEST =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80";

export const sampleHost: Host = {
  id: "host-1",
  name: "田中 芳子",
  businessName: "Atelier Lumina",
  email: "host@example.com",
  avatar: AVATAR_HOST,
  joinedAt: "2023年8月",
  spaceIds: ["sunset-atelier", "minimalist-lab", "harajuku-hideout"],
};

export const sampleGuest: Guest = {
  id: "guest-1",
  name: "佐藤 健太",
  email: "guest@example.com",
  avatar: AVATAR_GUEST,
  profession: "フォトグラファー",
  license: "美容師免許 第123456号",
  rating: 4.9,
  reviewCount: 12,
};

export const adminUsers: AdminUser[] = [
  {
    id: "host-1",
    name: sampleHost.name,
    avatar: sampleHost.avatar,
    role: "host",
    email: sampleHost.email,
    status: "active",
    joinedAt: sampleHost.joinedAt,
  },
  {
    id: "guest-1",
    name: sampleGuest.name,
    avatar: sampleGuest.avatar,
    role: "guest",
    email: sampleGuest.email,
    status: "active",
    joinedAt: "2024年1月",
  },
  {
    id: "guest-2",
    name: "鈴木 美咲",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
    role: "guest",
    email: "misaki@example.com",
    status: "pending",
    joinedAt: "2024年11月",
  },
  {
    id: "host-2",
    name: "渡辺 海斗",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    role: "host",
    email: "kaito@example.com",
    status: "suspended",
    joinedAt: "2023年12月",
  },
];

export const userStatusLabel: Record<AdminUser["status"], string> = {
  active: "有効",
  pending: "審査中",
  suspended: "停止中",
};

export const sampleApplications: Application[] = [
  {
    id: "ap-1",
    kind: "host",
    applicantName: "田中 芳子",
    avatar: AVATAR_HOST,
    detail: "Lumina Studio B",
    submittedAt: "2024年11月12日",
    status: "pending",
  },
  {
    id: "ap-2",
    kind: "guest",
    applicantName: "佐藤 健太",
    avatar: AVATAR_GUEST,
    detail: "フォトグラファー / 美容師免許あり",
    submittedAt: "2024年11月11日",
    status: "pending",
  },
  {
    id: "ap-3",
    kind: "host",
    applicantName: "渡辺 海斗",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    detail: "Greenery Co-work",
    submittedAt: "2024年11月10日",
    status: "pending",
  },
];
