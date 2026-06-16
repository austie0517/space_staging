/**
 * Shared domain types. Pure types only — no data, no logic — so both the mock
 * layer (`@/mock`) and the real services (`@/services/supabase`) can depend on
 * the same shapes. Screens import data through `@/services`, never from here
 * directly (except for typing props).
 */

/* ----------------------------------------------------------------- space */

export type Space = {
  id: string;
  title: string;
  area: string;
  description: string;
  pitchTitle: string;
  pitchBody: string;
  resourceCategory: string;
  capacityUnit: string;
  pricePerHour: number;
  minBookingHours: number;
  capacity: number;
  rating: number;
  reviewCount: number;
  spaceType: string;
  images: string[];
  amenities: string[];
  wifi: boolean;
  parking: boolean;
  published: boolean; // 公開状態（管理画面で使用）
};

export type SpaceFieldType = "text" | "number" | "boolean" | "select";

/** Mirrors the planned `space_fields` table (DB-managed display fields). */
export type SpaceField = {
  id: string;
  spaceId: string;
  key: string; // field_key
  label: string; // field_label
  value: string; // field_value (text-serialized)
  isPublic: boolean; // is_public
  order: number; // display_order
  type: SpaceFieldType; // field_type
  options?: string[]; // for type === "select"
};

export type RepeatType = "none" | "daily" | "weekly" | "monthly";

/** Mirrors the planned `availabilities` table (recurring availability rules). */
export type Availability = {
  id: string;
  spaceId: string;
  bookableLevel: "seat" | "space" | "both" | "closed";
  startTime: string; // "09:00"
  endTime: string; // "21:00"
  repeatType: RepeatType; // repeat_type
  repeatUntil?: string; // repeat_until — undefined = 無期限
  daysOfWeek: number[]; // day_of_week (0=日 .. 6=土), weekly only
  exceptions: string[]; // exception dates
};

/* --------------------------------------------------------------- booking */

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Booking = {
  id: string;
  code: string;
  spaceId: string;
  bookingLevel: "space" | "seat";
  quantity: number;
  spaceTitle: string;
  spaceImage: string;
  guestId: string;
  guestName: string;
  guestAvatar: string;
  guestProfession?: string;
  guestLicense?: string;
  guestVerified?: boolean;
  guestJoinedAt?: string;
  guestUsageCount?: number;
  guestRating?: number;
  guestReviewCount?: number;
  date: string; // e.g. 2024年10月23日
  start: string; // 10:00
  end: string; // 14:00
  hours: number;
  total: number; // guest pays
  hostEarnings: number; // host receives
  status: BookingStatus;
  message?: string;
};

/* ---------------------------------------------------------------- review */

export type Review = {
  id: string;
  spaceId: string;
  bookingId?: string;
  authorName: string;
  authorAvatar: string;
  rating: number; // 1–5
  body: string;
  createdAt: string; // e.g. 2024年10月
};

/* ----------------------------------------------------------------- users */

export type Host = {
  id: string;
  name: string;
  businessName: string;
  email: string;
  avatar: string;
  joinedAt: string;
  spaceIds: string[];
};

export type Guest = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  profession: string;
  license: string;
  rating: number;
  reviewCount: number;
};

export type AdminUser = {
  id: string;
  name: string;
  avatar: string;
  role: "guest" | "host" | "admin";
  email: string;
  phone?: string;
  status: "active" | "pending" | "suspended";
  joinedAt: string;
  profession?: string;
  license?: string;
  plan?: string;
  kycStatus?: "unsubmitted" | "pending" | "approved" | "rejected";
};

export type ApplicationKind = "host" | "guest";

export type Application = {
  id: string;
  kind: ApplicationKind;
  applicantName: string;
  avatar: string;
  detail: string; // space name (host) or profession (guest)
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
};

/* --------------------------------------------------------- notifications */

export type Notification = {
  id: string;
  icon: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export type NotificationCategory =
  | "予約"
  | "決済"
  | "キャンセル"
  | "審査"
  | "売上"
  | "その他";

export type NotificationType =
  | "user_registered"
  | "kyc_submitted"
  | "kyc_approved"
  | "space_submitted"
  | "space_approved"
  | "booking_requested"
  | "booking_approved"
  | "booking_rejected"
  | "payment_success"
  | "payment_failed"
  | "booking_cancelled"
  | "booking_reminder"
  | "entry_guide"
  | "review_request"
  | "review_posted"
  | "sales_confirmed"
  | "payout_completed"
  | "admin_message";

/* ----------------------------------------------------------- settlements */

export type Settlement = {
  id: string;
  hostName: string;
  period: string;
  gross: number;
  fee: number;
  net: number;
  status: "pending" | "paid";
};

/* ------------------------------------------------------------ audit log */

export type AuditAction =
  | "approve"
  | "reject"
  | "cancel"
  | "refund"
  | "payout"
  | "publish"
  | "unpublish"
  | "suspend"
  | "activate"
  | "profile_update"
  | "login";

/** Operational audit trail — "誰が・いつ・何に・何をしたか". */
export type AuditLog = {
  id: string;
  actor: string; // who (admin/operator name)
  action: AuditAction;
  target: string; // what (e.g. 予約 #ZL-88291)
  detail?: string;
  at: string; // when (display string, e.g. 2024-11-12 14:32)
};

/* --------------------------------------------------- guest account */

/** 本人確認(KYC) ステータス。Phase1 は手動審査。 */
export type KycStatus = "unsubmitted" | "pending" | "approved" | "rejected";

/** 登録済みカード（Stripe の payment_method を表示用に正規化）。 */
export type PaymentCard = {
  id: string;
  brand: string; // Visa, Mastercard, ...
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

/** LINE 通知の種別キー。 */
export type LineNotificationKey =
  | "bookingConfirmed"
  | "cancelled"
  | "entryPin"
  | "exitReminder";

export type LineConnection = {
  connected: boolean;
  displayName?: string;
  notifications: Record<LineNotificationKey, boolean>;
};

/** A guest's submitted KYC document, as seen in the admin review queue. */
export type KycSubmission = {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  docType: string; // 運転免許証 / パスポート など
  submittedAt: string;
  status: KycStatus;
};
