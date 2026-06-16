import type {
  KycStatus,
  KycSubmission,
  PaymentCard,
  LineConnection,
  LineNotificationKey,
} from "@/types";

/** Guest account state (KYC / payment / LINE). Phase 1 mock — wire to real
 *  Stripe / LINE / KYC storage in Phase 2 via the services layer. */

export const kycStatusLabel: Record<KycStatus, string> = {
  unsubmitted: "未提出",
  pending: "審査中",
  approved: "承認済み",
  rejected: "却下",
};

/** Demo guest starts without verification submitted. */
export const sampleKycStatus: KycStatus = "unsubmitted";

export const samplePaymentCards: PaymentCard[] = [
  {
    id: "card-1",
    brand: "Visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2027,
    isDefault: true,
  },
];

export const lineNotificationLabel: Record<LineNotificationKey, string> = {
  bookingConfirmed: "予約確定",
  cancelled: "キャンセル",
  entryPin: "入室PIN送付",
  exitReminder: "退室リマインド",
};

/** Order used when rendering the toggle list. */
export const lineNotificationKeys: LineNotificationKey[] = [
  "bookingConfirmed",
  "cancelled",
  "entryPin",
  "exitReminder",
];

export const sampleLineConnection: LineConnection = {
  connected: false,
  notifications: {
    bookingConfirmed: true,
    cancelled: true,
    entryPin: true,
    exitReminder: true,
  },
};

/** KYC submissions awaiting (or past) manual review in the admin console. */
export const sampleKycSubmissions: KycSubmission[] = [
  {
    id: "kyc-1",
    userId: "guest-2",
    userName: "鈴木 美咲",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
    docType: "運転免許証",
    submittedAt: "2024-11-12 10:14",
    status: "pending",
  },
  {
    id: "kyc-2",
    userId: "guest-3",
    userName: "高橋 翔",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    docType: "パスポート",
    submittedAt: "2024-11-11 19:42",
    status: "pending",
  },
  {
    id: "kyc-3",
    userId: "guest-1",
    userName: "佐藤 健太",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    docType: "運転免許証",
    submittedAt: "2024-11-08 08:30",
    status: "approved",
  },
];
