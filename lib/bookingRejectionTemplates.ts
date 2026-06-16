export type BookingRejectionReasonCode =
  | "business_conflict"
  | "usage_mismatch"
  | "facility_unavailable";

export type BookingRejectionTemplate = {
  code: BookingRejectionReasonCode;
  label: string;
  title: string;
  message: string;
};

export const BOOKING_REJECTION_TEMPLATES: BookingRejectionTemplate[] = [
  {
    code: "business_conflict",
    label: "営業都合",
    title: "営業都合により今回はお受けできません。",
    message:
      "社内利用や営業調整の都合により、該当日時のご予約をお受けできません。別日時でのご相談をお願いします。",
  },
  {
    code: "usage_mismatch",
    label: "利用条件不一致",
    title: "利用条件との不一致があり、今回はお受けできません。",
    message:
      "ご申請内容がスペースの利用条件と一部合致していないため、今回は承認を見送らせていただきます。利用条件をご確認のうえ、再度ご検討ください。",
  },
  {
    code: "facility_unavailable",
    label: "設備対応不可",
    title: "必要な設備対応が難しいため、今回はお受けできません。",
    message:
      "ご希望の設備・利用環境に十分お応えできないため、今回のご予約は承認を見送らせていただきます。",
  },
];

export function getBookingRejectionTemplate(code: BookingRejectionReasonCode) {
  return BOOKING_REJECTION_TEMPLATES.find((template) => template.code === code);
}

