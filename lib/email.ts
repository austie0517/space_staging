import type { NotificationCategory } from "@/types";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  category: NotificationCategory;
  recipientName?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "noreply@enbria.space";
const FROM_NAME = "Enbria Space";

function formatMailbox(email: string, displayName?: string | null) {
  if (!displayName?.trim()) return email;
  const safeName = displayName.replaceAll('"', '\\"');
  return `"${safeName}" <${email}>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function withActionText(payload: EmailPayload) {
  if (!payload.actionUrl) return payload.text;
  const label = payload.actionLabel?.trim() || "こちらからご確認ください";
  return `${payload.text}\n\n${label}\n${payload.actionUrl}`;
}

function renderHtml(payload: EmailPayload) {
  const heading = `${payload.category}のお知らせ`;
  const actionLabel = payload.actionLabel?.trim() || "こちらからご確認ください";
  const actionSection = payload.actionUrl
    ? `
          <div style="margin-top:24px;">
            <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#42474d;">
              ${escapeHtml(actionLabel)}
            </p>
            <a
              href="${escapeHtml(payload.actionUrl)}"
              style="display:inline-block;padding:12px 18px;border-radius:999px;background:#42617d;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;"
            >
              確認する
            </a>
            <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#6b7280;word-break:break-all;">
              ${escapeHtml(payload.actionUrl)}
            </p>
          </div>
      `
    : "";
  return `
    <div style="background:#fcf9f8;padding:32px 16px;font-family:'Noto Sans JP',sans-serif;color:#1b1c1c;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e2d6;border-radius:16px;overflow:hidden;">
        <div style="padding:20px 24px;background:#a7c7e7;color:#34536f;font-weight:700;font-size:14px;letter-spacing:.08em;">
          ${escapeHtml(heading)}
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 12px;font-size:14px;color:#42474d;">
            ${escapeHtml(payload.recipientName ? `${payload.recipientName}さん` : "ご利用者さま")}
          </p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.4;color:#42617d;">
            ${escapeHtml(payload.subject)}
          </h1>
          <p style="margin:0;font-size:15px;line-height:1.8;white-space:pre-line;color:#1b1c1c;">
            ${escapeHtml(payload.text)}
          </p>
          ${actionSection}
        </div>
      </div>
    </div>
  `;
}

export async function sendNotificationEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not configured");
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: formatMailbox(FROM_EMAIL, FROM_NAME),
      to: formatMailbox(payload.to, payload.recipientName),
      subject: payload.subject,
      text: withActionText(payload),
      html: renderHtml(payload),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`[email] resend failed (${response.status}): ${body}`);
  }
}
