import type { AuditLog, AuditAction } from "@/types";

export const auditActionLabel: Record<AuditAction, string> = {
  approve: "承認",
  reject: "却下",
  cancel: "キャンセル",
  refund: "返金",
  payout: "振込",
  publish: "公開",
  unpublish: "非公開",
  suspend: "利用停止",
  activate: "利用再開",
  profile_update: "プロフィール変更",
  login: "ログイン",
};

export const auditActionIcon: Record<AuditAction, string> = {
  approve: "check_circle",
  reject: "cancel",
  cancel: "cancel",
  refund: "currency_yen",
  payout: "payments",
  publish: "visibility",
  unpublish: "visibility_off",
  suspend: "block",
  activate: "check_circle",
  profile_update: "manage_accounts",
  login: "login",
};

/** success | error | info | neutral — drives the badge / icon tone. */
export const auditActionTone: Record<
  AuditAction,
  "success" | "error" | "warning" | "neutral"
> = {
  approve: "success",
  reject: "error",
  cancel: "error",
  refund: "warning",
  payout: "success",
  publish: "success",
  unpublish: "neutral",
  suspend: "error",
  activate: "success",
  profile_update: "neutral",
  login: "neutral",
};

/** Newest first. */
export const sampleAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    actor: "管理者 山田",
    action: "refund",
    target: "予約 #ZL-77310",
    detail: "ゲスト都合により全額返金（¥10,230）",
    at: "2024-11-12 15:48",
  },
  {
    id: "log-2",
    actor: "管理者 山田",
    action: "cancel",
    target: "予約 #ZL-77310",
    detail: "返金に伴い予約をキャンセル",
    at: "2024-11-12 15:47",
  },
  {
    id: "log-3",
    actor: "管理者 佐藤",
    action: "approve",
    target: "ホスト申請 渡辺 海斗",
    detail: "本人確認書類を確認のうえ承認",
    at: "2024-11-12 11:20",
  },
  {
    id: "log-4",
    actor: "管理者 佐藤",
    action: "unpublish",
    target: "スペース Harajuku Hideout",
    detail: "設備点検のため一時非公開",
    at: "2024-11-11 18:05",
  },
  {
    id: "log-5",
    actor: "管理者 山田",
    action: "suspend",
    target: "ユーザー 渡辺 海斗",
    detail: "規約違反の通報により利用停止",
    at: "2024-11-10 09:12",
  },
  {
    id: "log-6",
    actor: "管理者 山田",
    action: "login",
    target: "管理コンソール",
    at: "2024-11-10 09:00",
  },
];
