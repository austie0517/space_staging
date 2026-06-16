// prisma/seeds/notifications.ts
import type { Prisma, PrismaClient } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

const TEMPLATES = [
  {
    type: 'booking_requested',
    title: '予約申請を受け付けました',
    body: '予約申請をホストへ送信しました。',
  },
  {
    type: 'booking_approved',
    title: '予約が承認されました',
    body: 'ホストが予約を承認しました。決済へ進んでください。',
  },
  {
    type: 'payment_success',
    title: 'お支払いが完了しました',
    body: 'ご利用料金の決済が完了しました。',
  },
  {
    type: 'booking_cancelled',
    title: 'キャンセルを受け付けました',
    body: '予約のキャンセルを受け付けました。',
  },
  {
    type: 'kyc_submitted',
    title: '本人確認を受け付けました',
    body: '審査が完了するまでしばらくお待ちください。',
  },
  {
    type: 'space_submitted',
    title: 'スペース審査の依頼',
    body: '新しいスペースが登録されました。',
  },
  {
    type: 'review_posted',
    title: 'レビューが投稿されました',
    body: 'ゲストからレビューが届きました。',
  },
  {
    type: 'payout_completed',
    title: '振込が完了しました',
    body: '売上の振込処理が完了しました。',
  },
] as const;

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedNotifications(prisma: PrismaClient): Promise<void> {
  await prisma.notification.deleteMany();

  const users = await prisma.user.findMany();
  const records: Prisma.NotificationCreateManyInput[] = [];
  const NOTIFICATION_COUNT = 300;

  for (let i = 0; i < NOTIFICATION_COUNT; i += 1) {
    const user = users[i % users.length];
    const template = randomFrom(TEMPLATES);

    records.push({
      id: uuid(),
      userId: user.id,
      type: template.type,
      title: template.title,
      body: template.body,
      isRead: i % 4 === 0,
      createdAt: new Date(),
    });
  }

  await prisma.notification.createMany({
    data: records,
    skipDuplicates: true,
  });
}
