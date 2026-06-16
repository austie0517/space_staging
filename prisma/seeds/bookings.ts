// prisma/seeds/bookings.ts
import type { Prisma, PrismaClient, Space, Booking } from '@prisma/client';

function uuid(): string {
  return crypto.randomUUID();
}

type BookingStatus = 'pending' | 'approved' | 'cancelled' | 'completed';

const STATUS_WEIGHTS: { status: BookingStatus; weight: number }[] = [
  { status: 'approved', weight: 0.7 },
  { status: 'completed', weight: 0.2 },
  { status: 'pending', weight: 0.05 },
  { status: 'cancelled', weight: 0.05 },
];

function pickStatus(): BookingStatus {
  const r = Math.random();
  let acc = 0;
  for (const { status, weight } of STATUS_WEIGHTS) {
    acc += weight;
    if (r <= acc) return status;
  }
  return 'approved';
}

export async function seedBookings(
  prisma: PrismaClient,
  spaces: Space[],
): Promise<Booking[]> {
  await prisma.booking.deleteMany();

  const guests = await prisma.guest.findMany();
  const AVAIL_DAYS = 30;
  const now = new Date();

  const records: Prisma.BookingCreateManyInput[] = [];
  const BOOKING_COUNT = 500;

  for (let i = 0; i < BOOKING_COUNT; i += 1) {
    const space = spaces[i % spaces.length];
    const guest = guests[i % guests.length];

    const dayOffset = i % AVAIL_DAYS;
    const start = new Date(now);
    start.setDate(now.getDate() + dayOffset);
    start.setHours(10, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    const status = pickStatus();

    records.push({
      id: uuid(),
      spaceId: space.id,
      guestId: guest.id,
      status,
      startAt: start,
      endAt: end,
      totalPrice: 5000 + (i % 10) * 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await prisma.booking.createMany({
    data: records,
    skipDuplicates: true,
  });

  return prisma.booking.findMany();
}
