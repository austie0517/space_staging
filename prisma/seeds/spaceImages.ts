// prisma/seeds/spaceImages.ts
import type { Prisma, PrismaClient, Space } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

function buildImage(spaceId: string, index: number): Prisma.SpaceImageCreateManyInput {
  const seed = `${spaceId}-${index}`;
  return {
    id: uuid(),
    spaceId,
    url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`,
    alt: `Space image ${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function seedSpaceImages(
  prisma: PrismaClient,
  spaces: Space[],
): Promise<void> {
  await prisma.spaceImage.deleteMany();

  const images: Prisma.SpaceImageCreateManyInput[] = [];

  spaces.forEach((space) => {
    const count = 3 + (Math.floor(Math.random() * 3)); // 3〜5枚
    for (let i = 0; i < count; i += 1) {
      images.push(buildImage(space.id, i + 1));
    }
  });

  if (images.length > 0) {
    await prisma.spaceImage.createMany({
      data: images,
      skipDuplicates: true,
    });
  }
}
