// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeds/users';
import { seedHosts } from './seeds/hosts';
import { seedGuests } from './seeds/guests';
import { seedSpaces } from './seeds/spaces';
import { seedSpaceImages } from './seeds/spaceImages';
import { seedAvailabilities } from './seeds/availabilities';
import { seedBookings } from './seeds/bookings';
import { seedReviews } from './seeds/reviews';
import { seedFavorites } from './seeds/favorites';
import { seedNotifications } from './seeds/notifications';
import { seedCoupons } from './seeds/coupons';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding started');

  await prisma.$transaction(async (tx) => {
    await seedUsers(tx);
    await seedHosts(tx);
    await seedGuests(tx);
    const spaces = await seedSpaces(tx);
    await seedSpaceImages(tx, spaces);
    await seedAvailabilities(tx, spaces);
    const bookings = await seedBookings(tx, spaces);
    await seedReviews(tx, bookings);
    await seedFavorites(tx, spaces);
    await seedNotifications(tx);
    await seedCoupons(tx);
  });

  console.log('✅ Seeding completed');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
