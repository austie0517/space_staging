// prisma/seeds/coupons.ts
import type { Prisma, PrismaClient } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

export async function seedCoupons(prisma: PrismaClient): Promise<void> {
  await prisma.coupon.deleteMany();

  const records: Prisma.CouponCreateManyInput[] = [];
  const COUPON_COUNT = 10;

  for (let i = 0; i < COUPON_COUNT; i += 1) {
    const code = `WELCOME${String(i + 1).padStart(2, '0')}`;
    const discountPercent = 5 + (i * 2);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    records.push({
      id: uuid(),
      code,
      discountPercent,
      maxUsage: 100,
      expiresAt,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await prisma.coupon.createMany({
    data: records,
    skipDuplicates: true,
  });
}
