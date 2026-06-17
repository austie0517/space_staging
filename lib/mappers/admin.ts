import { optimizeImageUrl } from "@/lib/imageUrl";
import type {
  AdminUser,
  Application,
  AuditAction,
  AuditLog,
  KycStatus,
  KycSubmission,
  Settlement,
} from "@/types";
import type { Prisma } from "@prisma/client";

const AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80";

const pad = (n: number) => String(n).padStart(2, "0");
const jdate = (d: Date) =>
  `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
const ymd = (d: Date) =>
  `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`;
const datetime = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

const appStatus = (s: string): Application["status"] =>
  s === "approved" || s === "rejected" ? s : "pending";

/* ---------------------------------------------------- applications */

type HostApp = Prisma.HostApplicationGetPayload<{ include: { user: true } }>;
type GuestApp = Prisma.GuestApplicationGetPayload<{ include: { user: true } }>;

export function hostAppToUI(a: HostApp): Application {
  return {
    id: a.id,
    kind: "host",
    applicantName: a.user.name,
    avatar: AVATAR,
    detail: a.idDocumentType ?? "ホスト申請",
    submittedAt: jdate(a.createdAt),
    status: appStatus(a.status),
  };
}

export function guestAppToUI(a: GuestApp): Application {
  return {
    id: a.id,
    kind: "guest",
    applicantName: a.user.name,
    avatar: AVATAR,
    detail: a.profession ?? "施術者申請",
    submittedAt: jdate(a.createdAt),
    status: appStatus(a.status),
  };
}

/* ------------------------------------------------------------- kyc */

type KycRow = Prisma.KycSubmissionGetPayload<{ include: { user: true } }>;

const kycStatus = (s: string): KycStatus =>
  s === "approved" || s === "rejected" || s === "pending" ? s : "pending";

export function toUIKycSubmission(k: KycRow): KycSubmission {
  return {
    id: k.id,
    userId: k.userId,
    userName: k.user.name,
    avatar: optimizeImageUrl(k.user.avatarUrl || AVATAR, {
      width: 160,
      quality: 55,
    }),
    docType: k.docType,
    submittedAt: jdate(k.submittedAt),
    status: kycStatus(k.status),
  };
}

/* ----------------------------------------------------------- users */

const userStatus = (s: string): AdminUser["status"] =>
  s === "pending" || s === "suspended" ? s : "active";

type AdminUserRow = Prisma.UserGetPayload<{
  include: {
    guest: true;
    host: true;
    kycSubmissions: true;
  };
}>;

export function toAdminUser(u: AdminUserRow): AdminUser {
  const role: AdminUser["role"] = u.isAdmin
    ? "admin"
    : u.isHost
      ? "host"
      : "guest";
  const latestKyc = u.kycSubmissions[0];
  return {
    id: u.id,
    name: u.name,
    avatar: optimizeImageUrl(u.avatarUrl || AVATAR, {
      width: 160,
      quality: 55,
    }),
    role,
    email: u.email,
    phone: u.phone || undefined,
    status: userStatus(u.status),
    joinedAt: jdate(u.createdAt),
    profession: u.guest?.profession || undefined,
    license: u.guest?.license || undefined,
    plan: u.host?.plan || undefined,
    kycStatus:
      latestKyc &&
      (latestKyc.status === "approved" ||
        latestKyc.status === "rejected" ||
        latestKyc.status === "pending")
        ? latestKyc.status
        : "unsubmitted",
  };
}

/* ------------------------------------------------------ settlements */

type SettlementRow = Prisma.SettlementGetPayload<{
  include: { host: { include: { user: true } } };
}>;

export function toUISettlement(s: SettlementRow): Settlement {
  return {
    id: s.id,
    hostName: s.host.user.name,
    period: `${ymd(s.periodStart)}〜${ymd(s.periodEnd)}`,
    gross: s.bookingTotal,
    fee: s.platformFee,
    net: s.payoutAmount,
    status: s.status === "paid" ? "paid" : "pending",
  };
}

/* ------------------------------------------------------- audit logs */

type AuditRow = Prisma.AuditLogGetPayload<{ include: { user: true } }>;

const KNOWN: ReadonlySet<string> = new Set([
  "approve",
  "reject",
  "cancel",
  "refund",
  "payout",
  "publish",
  "unpublish",
  "suspend",
  "activate",
  "profile_update",
  "login",
]);
const action = (a: string): AuditAction =>
  (KNOWN.has(a) ? a : "login") as AuditAction;

export function toUIAuditLog(l: AuditRow): AuditLog {
  return {
    id: l.id,
    actor: l.user.name,
    action: action(l.action),
    target: [l.targetType, l.targetId].filter(Boolean).join(" ") || "-",
    detail: undefined,
    at: datetime(l.createdAt),
  };
}
