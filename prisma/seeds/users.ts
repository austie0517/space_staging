// prisma/seeds/users.ts
import type { Prisma, PrismaClient } from '@prisma/client';

const HOST_COUNT = 20;
const GUEST_COUNT = 100;
const ADMIN_COUNT = 3;

function uuid(): string {
  return crypto.randomUUID();
}

function buildUser(
  index: number,
  role: 'HOST' | 'GUEST' | 'ADMIN',
): Prisma.UserCreateManyInput {
  const id = uuid();
  return {
    id,
    email: `${role.toLowerCase()}${index}@example.com`,
    name: `${role} User ${index}`,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  await prisma.user.deleteMany();

  const users: Prisma.UserCreateManyInput[] = [];

  for (let i = 0; i < HOST_COUNT; i += 1) {
    users.push(buildUser(i + 1, 'HOST'));
  }
  for (let i = 0; i < GUEST_COUNT; i += 1) {
    users.push(buildUser(i + 1, 'GUEST'));
  }
  for (let i = 0; i < ADMIN_COUNT; i += 1) {
    users.push(buildUser(i + 1, 'ADMIN'));
  }

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
}
