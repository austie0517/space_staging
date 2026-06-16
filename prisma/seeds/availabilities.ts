// prisma/seeds/availabilities.ts
import type { Prisma, PrismaClient, Space } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

export async function seedAvailabilities(
  prisma: PrismaClient,
  spaces: Space[],
): Promise<void> {
  await prisma.availability.deleteMany();

  const days = 90;
  const now = new Date();
  const records: Prisma.AvailabilityCreateManyInput[] = [];

  spaces.forEach((space) => {
    for (let d = 0; d < days; d += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);

      records.push({
        id: uuid(),
        spaceId: space.id,
        date,
        isAvailable: d % 7 !== 0, // 週1で休み
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  await prisma.availability.createMany({
    data: records,
    skipDuplicates: true,
  });
}
