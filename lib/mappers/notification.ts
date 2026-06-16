import type {
  Notification,
  NotificationCategory,
  NotificationType,
} from "@/types";
import type { Notification as PrismaNotification } from "@prisma/client";

// notifications.type → Material Symbols icon name.
const ICON_BY_TYPE: Record<NotificationType, string> = {
  user_registered: "person_add",
  kyc_submitted: "badge",
  kyc_approved: "verified_user",
  space_submitted: "domain_add",
  space_approved: "storefront",
  booking_requested: "pending_actions",
  booking_approved: "event_available",
  booking_rejected: "event_busy",
  payment_success: "credit_score",
  payment_failed: "credit_card_off",
  booking_cancelled: "cancel",
  booking_reminder: "notifications_active",
  entry_guide: "vpn_key",
  review_request: "rate_review",
  review_posted: "star",
  sales_confirmed: "price_check",
  payout_completed: "payments",
  admin_message: "support_agent",
};

const CATEGORY_BY_TYPE: Record<NotificationType, NotificationCategory> = {
  user_registered: "審査",
  kyc_submitted: "審査",
  kyc_approved: "審査",
  space_submitted: "審査",
  space_approved: "審査",
  booking_requested: "予約",
  booking_approved: "予約",
  booking_rejected: "予約",
  payment_success: "決済",
  payment_failed: "決済",
  booking_cancelled: "キャンセル",
  booking_reminder: "予約",
  entry_guide: "予約",
  review_request: "予約",
  review_posted: "予約",
  sales_confirmed: "売上",
  payout_completed: "売上",
  admin_message: "その他",
};

function normalizeType(type: string | null): NotificationType {
  switch (type) {
    case "booking_confirmed":
      return "booking_approved";
    case "booking_pending":
    case "booking_request":
      return "booking_requested";
    case "cancelled":
      return "booking_cancelled";
    case "payment":
      return "payment_success";
    case "payout":
      return "payout_completed";
    case "review":
      return "review_posted";
    case "kyc":
      return "kyc_submitted";
    case "system":
      return "admin_message";
    default:
      return (type as NotificationType) || "admin_message";
  }
}

const iconFor = (type: string | null) =>
  ICON_BY_TYPE[normalizeType(type)] || "notifications";

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Map a Prisma `Notification` to the UI `Notification` shape. */
export function toUINotification(n: PrismaNotification): Notification {
  const d = n.sentAt ?? n.createdAt;
  const type = normalizeType(n.type);
  return {
    id: n.id,
    icon: iconFor(n.type),
    category: CATEGORY_BY_TYPE[type] ?? "その他",
    type,
    title: n.title ?? "",
    body: n.body ?? "",
    time: dateTimeFormatter.format(d),
    unread: !n.isRead,
  };
}
