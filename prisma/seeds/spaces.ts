// prisma/seeds/spaces.ts
import type { Prisma, PrismaClient, Space } from '@prisma/client';

const SPACE_TYPES = [
  'Hair Salon',
  'Beauty Salon',
  'Nail Studio',
  'Creative Studio',
  'Photo Studio',
  'Meeting Room',
  'Private Office',
  'Coworking Space',
] as const;

const WARDS = [
  '渋谷区',
  '新宿区',
  '港区',
  '中央区',
  '台東区',
  '足立区',
  '江東区',
] as const;

function uuid(): string {
  return crypto.randomUUID();
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSpace(index: number, hostId: string): Prisma.SpaceCreateManyInput {
  const type = randomFrom(SPACE_TYPES);
  const ward = randomFrom(WARDS);
  const capacity = 2 + (index % 10);

  return {
    id: uuid(),
    hostId,
    title: `${type} #${index}`,
    description: `${type} in 東京都${ward}。面貸し・スペース貸し向けのテストデータです。`,
    type,
    prefecture: '東京都',
    ward,
    address: `${ward} テスト${index}丁目`,
    maxCapacity: capacity,
    hasWifi: true,
    hasParking: index % 3 === 0,
    hasKitchen: type === 'Creative Studio' || type === 'Coworking Space',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function seedSpaces(prisma: PrismaClient): Promise<Space[]> {
  await prisma.space.deleteMany();

  const hosts = await prisma.host.findMany();
  const spaces: Prisma.SpaceCreateManyInput[] = [];

  const SPACE_COUNT = 100;

  for (let i = 0; i < SPACE_COUNT; i += 1) {
    const host = hosts[i % hosts.length];
    spaces.push(buildSpace(i + 1, host.id));
  }

  await prisma.space.createMany({
    data: spaces,
    skipDuplicates: true,
  });

  return prisma.space.findMany();
}
