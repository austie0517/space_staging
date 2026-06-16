// prisma/seeds/reviews.ts
import type { Prisma, PrismaClient, Booking } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

function pickRating(): number {
  const base = 4 + Math.random(); // 4〜5中心
  return Math.min(5, Math.max(1, Math.round(base * 10) / 10));
}

export async function seedReviews(
  prisma: PrismaClient,
  bookings: Booking[],
): Promise<void> {
  await prisma.review.deleteMany();

  const records: Prisma.ReviewCreateManyInput[] = [];
  const REVIEW_COUNT = 200;

  for (let i = 0; i < REVIEW_COUNT; i += 1) {
    const booking = bookings[i % bookings.length];
    records.push({
      id: uuid(),
      bookingId: booking.id,
      rating: pickRating(),
      comment: 'とても快適なスペースでした。テストデータのレビューです。',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await prisma.review.createMany({
    data: records,
    skipDuplicates: true,
  });
}
