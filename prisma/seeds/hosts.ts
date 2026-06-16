// prisma/seeds/hosts.ts
import type { Prisma, PrismaClient } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

export async function seedHosts(prisma: PrismaClient): Promise<void> {
  await prisma.host.deleteMany();

  const hostUsers = await prisma.user.findMany({
    where: { role: 'HOST' },
  });

  const hosts: Prisma.HostCreateManyInput[] = hostUsers.map((user, index) => ({
    id: uuid(),
    userId: user.id,
    displayName: `Host ${index + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (hosts.length > 0) {
    await prisma.host.createMany({
      data: hosts,
      skipDuplicates: true,
    });
  }
}
