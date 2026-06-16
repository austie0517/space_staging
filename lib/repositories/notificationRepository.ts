import { getBookingRejectionTemplate } from "@/lib/bookingRejectionTemplates";
import { sendNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import type { NotificationCategory, NotificationType } from "@/types";

type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
};

type NotificationDelivery = NotificationInput & {
  email?: string | null;
  recipientName?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
};

/** A user's notifications, newest first. */
export async function getNotificationsByUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUnreadNotificationCount(
  userId: string,
  excludedTypes: NotificationType[] = [],
  includedTypes: NotificationType[] = [],
) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
      ...(includedTypes.length > 0
        ? { type: { in: includedTypes } }
        : {}),
      ...(excludedTypes.length > 0
        ? { type: { notIn: excludedTypes } }
        : {}),
    },
  });
}

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      isRead: false,
    },
  });
}

export async function createNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) return;
  await prisma.notification.createMany({
    data: inputs.map((input) => ({ ...input, isRead: false })),
  });
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  if (ids.length === 0) return { count: 0 };
  return prisma.notification.updateMany({
    where: {
      userId,
      id: { in: ids },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

async function safeNotify(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.error(`[notifications:${name}] failed:`, e);
  }
}

async function getAdminUsers() {
  return prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true },
  });
}

function categoryForType(type: NotificationType): NotificationCategory {
  if (
    type === "booking_requested" ||
    type === "booking_approved" ||
    type === "booking_rejected" ||
    type === "booking_reminder" ||
    type === "entry_guide" ||
    type === "review_request" ||
    type === "review_posted"
  ) {
    return "予約";
  }
  if (type === "payment_success" || type === "payment_failed") return "決済";
  if (type === "booking_cancelled") return "キャンセル";
  if (
    type === "kyc_submitted" ||
    type === "kyc_approved" ||
    type === "space_submitted" ||
    type === "space_approved" ||
    type === "user_registered"
  ) {
    return "審査";
  }
  if (type === "sales_confirmed" || type === "payout_completed") return "売上";
  return "その他";
}

function baseAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function routeForNotification(input: NotificationDelivery) {
  const baseUrl = baseAppUrl();
  switch (input.type) {
    case "kyc_submitted":
    case "kyc_approved":
      return `${baseUrl}/me/verify`;
    case "space_submitted":
    case "space_approved":
      return `${baseUrl}/host/spaces`;
    case "booking_requested":
      return `${baseUrl}/host/bookings`;
    case "booking_approved":
    case "booking_rejected":
    case "booking_cancelled":
    case "payment_success":
    case "payment_failed":
    case "review_request":
      return `${baseUrl}/guest/bookings`;
    case "review_posted":
    case "sales_confirmed":
    case "payout_completed":
      return `${baseUrl}/host/earnings`;
    case "admin_message":
      return `${baseUrl}/admin/notifications`;
    default:
      return `${baseUrl}/me/notifications`;
  }
}

async function deliverNotification(input: NotificationDelivery) {
  await createNotification(input);
  if (!input.email) return;
  try {
    await sendNotificationEmail({
      to: input.email,
      subject: input.title,
      text: input.body,
      category: categoryForType(input.type),
      recipientName: input.recipientName,
      actionUrl: input.actionUrl ?? routeForNotification(input),
      actionLabel: input.actionLabel ?? "詳細は以下より、こちらからご確認ください。",
    });
  } catch (e) {
    console.error("[email:notification] failed:", e);
  }
}

async function deliverNotifications(inputs: NotificationDelivery[]) {
  await Promise.all(inputs.map((input) => deliverNotification(input)));
}

async function notifyAdmins(input: Omit<NotificationDelivery, "userId" | "email" | "recipientName">) {
  const admins = await getAdminUsers();
  await deliverNotifications(
    admins.map((admin) => ({
      userId: admin.id,
      email: admin.email,
      recipientName: admin.name,
      ...input,
    })),
  );
}

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function bookingWindow(startAt: Date, endAt: Date) {
  return `${dateFormatter.format(startAt)}-${dateFormatter.format(endAt)}`;
}

async function getBookingNotificationContext(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guest: { include: { user: true } },
      space: { include: { host: { include: { user: true } } } },
    },
  });
}

export async function notifyKycSubmitted(userId: string, userName: string) {
  await safeNotify("kyc_submitted", async () => {
    await createNotification({
      userId,
      type: "kyc_submitted",
      title: "本人確認書類を受け付けました",
      body: "書類を確認のうえ、審査結果をお知らせします。しばらくお待ちください。",
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (user?.email) {
      try {
        await sendNotificationEmail({
          to: user.email,
          subject: "本人確認書類を受け付けました",
          text: "Enbria Spaceで本人確認書類を受け付けました。\n書類を確認のうえ、審査結果をお知らせします。しばらくお待ちください。",
          category: "審査",
          recipientName: user.name,
          actionUrl: `${baseAppUrl()}/me/verify`,
          actionLabel: "提出内容の確認は、こちらからご確認ください。",
        });
      } catch (e) {
        console.error("[email:kyc_submitted] failed:", e);
      }
    }
    await notifyAdmins({
      type: "kyc_submitted",
      title: "本人確認の審査依頼があります",
      body: `${userName}さんから本人確認書類が提出されました。管理画面で内容をご確認ください。`,
      actionUrl: `${baseAppUrl()}/admin/kyc`,
      actionLabel: "審査内容は、こちらからご確認ください。",
    });
  });
}

export async function notifyKycReviewed(kycId: string, status: string) {
  if (status !== "approved") return;
  await safeNotify("kyc_approved", async () => {
    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: kycId },
      include: { user: true },
    });
    if (!kyc) return;
    await deliverNotification({
      userId: kyc.userId,
      email: kyc.user.email,
      recipientName: kyc.user.name,
      type: "kyc_approved",
      title: "本人確認が完了しました",
      body: "本人確認の審査が完了しました。予約申請をご利用いただけます。",
    });
  });
}

export async function notifySpaceSubmitted(params: {
  hostUserId: string;
  hostName: string;
  spaceName: string;
}) {
  await safeNotify("space_submitted", async () => {
    const host = await prisma.user.findUnique({
      where: { id: params.hostUserId },
      select: { email: true, name: true },
    });
    await deliverNotification({
      userId: params.hostUserId,
      email: host?.email,
      recipientName: host?.name,
      type: "space_submitted",
      title: "スペース登録を受け付けました",
      body: `${params.spaceName} の登録内容を受け付けました。公開準備のため、内容を確認しています。`,
    });
    await notifyAdmins({
      type: "space_submitted",
      title: "スペース審査の依頼があります",
      body: `${params.hostName}さんが ${params.spaceName} を登録しました。管理画面で内容をご確認ください。`,
      actionUrl: `${baseAppUrl()}/admin`,
      actionLabel: "審査内容は、こちらからご確認ください。",
    });
  });
}

export async function notifySpaceApproved(params: {
  hostUserId: string;
  spaceName: string;
}) {
  await safeNotify("space_approved", async () => {
    const host = await prisma.user.findUnique({
      where: { id: params.hostUserId },
      select: { email: true, name: true },
    });
    await deliverNotification({
      userId: params.hostUserId,
      email: host?.email,
      recipientName: host?.name,
      type: "space_approved",
      title: "スペースが公開されました",
      body: `${params.spaceName} の審査が完了し、公開されました。`,
    });
  });
}

export async function notifyBookingRequested(bookingId: string) {
  await safeNotify("booking_requested", async () => {
    const booking = await getBookingNotificationContext(bookingId);
    if (!booking) return;
    const when = bookingWindow(booking.startAt, booking.endAt);
    await deliverNotification({
      userId: booking.space.host.userId,
      email: booking.space.host.user.email,
      recipientName: booking.space.host.user.name,
      type: "booking_requested",
      title: "新しい予約申請が届きました",
      body: `${booking.guest.user.name}さんから ${booking.space.name}（${when}）の予約申請が届いています。内容をご確認ください。`,
    });
  });
}

export async function notifyBookingReviewed(
  bookingId: string,
  status: "approved" | "rejected",
  rejection?: {
    reasonCode: string;
    message: string;
  },
) {
  await safeNotify(`booking_${status}`, async () => {
    const booking = await getBookingNotificationContext(bookingId);
    if (!booking) return;
    const approved = status === "approved";
    const when = bookingWindow(booking.startAt, booking.endAt);
    const template = rejection
      ? getBookingRejectionTemplate(rejection.reasonCode as never)
      : null;
    const rejectionBody = rejection?.message.trim();
    await deliverNotification({
      userId: booking.guest.userId,
      email: booking.guest.user.email,
      recipientName: booking.guest.user.name,
      type: approved ? "booking_approved" : "booking_rejected",
      title: approved ? "予約が承認されました" : "予約リクエストは辞退されました",
      body: approved
        ? `${booking.space.name}（${when}）の予約が承認されました。カードの確保枠を本課金に進め、予約成立のご案内をお送りします。`
        : [
            `${booking.space.name}（${when}）の予約リクエストは今回は見送りとなりました。カードの確保枠は解放されます。`,
            template ? `理由カテゴリ: ${template.label}` : null,
            rejectionBody ? `ご案内: ${rejectionBody}` : null,
          ]
            .filter(Boolean)
            .join("\n\n"),
      actionUrl: `${baseAppUrl()}/guest/bookings`,
      actionLabel: "予約内容は、こちらからご確認ください。",
    });
  });
}

export async function notifyBookingCancelled(bookingId: string) {
  await safeNotify("booking_cancelled", async () => {
    const booking = await getBookingNotificationContext(bookingId);
    if (!booking) return;
    const when = bookingWindow(booking.startAt, booking.endAt);
    await deliverNotifications([
      {
        userId: booking.guest.userId,
        email: booking.guest.user.email,
        recipientName: booking.guest.user.name,
        type: "booking_cancelled",
        title: "キャンセルを受け付けました",
        body: `${booking.space.name}（${when}）の予約キャンセルを受け付けました。返金や決済調整がある場合は別途ご案内します。`,
        actionUrl: `${baseAppUrl()}/guest/bookings`,
        actionLabel: "予約内容は、こちらからご確認ください。",
      },
      {
        userId: booking.space.host.userId,
        email: booking.space.host.user.email,
        recipientName: booking.space.host.user.name,
        type: "booking_cancelled",
        title: "予約がキャンセルされました",
        body: `${booking.guest.user.name}さんが ${booking.space.name}（${when}）の予約をキャンセルしました。内容をご確認ください。`,
        actionUrl: `${baseAppUrl()}/host/bookings`,
        actionLabel: "予約内容は、こちらからご確認ください。",
      },
    ]);
  });
}

export async function notifyReviewPosted(bookingId: string) {
  await safeNotify("review_posted", async () => {
    const booking = await getBookingNotificationContext(bookingId);
    if (!booking) return;
    await deliverNotification({
      userId: booking.space.host.userId,
      email: booking.space.host.user.email,
      recipientName: booking.space.host.user.name,
      type: "review_posted",
      title: "レビューが投稿されました",
      body: `${booking.guest.user.name}さんが ${booking.space.name} にレビューを投稿しました。内容をご確認ください。`,
      actionUrl: `${baseAppUrl()}/host/notifications`,
      actionLabel: "レビュー内容は、こちらからご確認ください。",
    });
  });
}

export async function notifyPayoutCompleted(settlementId: string) {
  await safeNotify("payout_completed", async () => {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { host: { include: { user: true } } },
    });
    if (!settlement) return;
    await deliverNotification({
      userId: settlement.host.userId,
      email: settlement.host.user.email,
      recipientName: settlement.host.user.name,
      type: "payout_completed",
      title: "売上の振込が完了しました",
      body: `${dateOnlyFormatter.format(settlement.periodStart)}から${dateOnlyFormatter.format(settlement.periodEnd)}までの売上について、¥${settlement.payoutAmount.toLocaleString()} の振込が完了しました。`,
    });
  });
}
