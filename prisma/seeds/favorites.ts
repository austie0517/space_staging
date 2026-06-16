// prisma/seeds/favorites.ts
import type { Prisma, PrismaClient, Space } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

export async function seedFavorites(
  prisma: PrismaClient,
  spaces: Space[],
): Promise<void> {
  await prisma.favorite.deleteMany();

  const guests = await prisma.guest.findMany();
  const records: Prisma.FavoriteCreateManyInput[] = [];
  const FAVORITE_COUNT = 300;

  for (let i = 0; i < FAVORITE_COUNT; i += 1) {
    const guest = guests[i % guests.length];
    const space = spaces[(i * 3) % spaces.length];

    records.push({
      id: uuid(),
      guestId: guest.id,
      spaceId: space.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await prisma.favorite.createMany({
    data: records,
    skipDuplicates: true,
  });
}
