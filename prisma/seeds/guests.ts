// prisma/seeds/guests.ts
import type { Prisma, PrismaClient } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

export async function seedGuests(prisma: PrismaClient): Promise<void> {
  await prisma.guest.deleteMany();

  const guestUsers = await prisma.user.findMany({
    where: { role: 'GUEST' },
  });

  const guests: Prisma.GuestCreateManyInput[] = guestUsers.map((user, index) => ({
    id: uuid(),
    userId: user.id,
    profession: index % 2 === 0 ? 'Freelance Stylist' : 'Creator',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (guests.length > 0) {
    await prisma.guest.createMany({
      data: guests,
      skipDuplicates: true,
    });
  }
}
