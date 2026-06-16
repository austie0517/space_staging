import type { Notification } from "@/types";

export const sampleNotifications: Notification[] = [
  {
    id: "nt-1",
    icon: "check_circle",
    category: "予約",
    type: "booking_approved",
    title: "予約が確定しました",
    body: "Minimalist Lab・11月4日 13:00–18:00 の予約が確定しました。",
    time: "2時間前",
    unread: true,
  },
  {
    id: "nt-2",
    icon: "hourglass_top",
    category: "予約",
    type: "booking_requested",
    title: "予約リクエストを送信しました",
    body: "Sunset Atelier・10月23日 のリクエストをホストが確認中です。",
    time: "1日前",
    unread: true,
  },
  {
    id: "nt-3",
    icon: "payments",
    category: "決済",
    type: "payment_success",
    title: "お支払いが完了しました",
    body: "Harajuku Hideout のご利用料金 ¥10,230 を受領しました。",
    time: "3日前",
    unread: false,
  },
  {
    id: "nt-4",
    icon: "star",
    category: "予約",
    type: "review_request",
    title: "レビューのお願い",
    body: "先日ご利用の Harajuku Hideout はいかがでしたか？",
    time: "5日前",
    unread: false,
  },
];
