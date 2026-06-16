// prisma/addGuests.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function uuid() {
    return crypto.randomUUID();
}

async function main() {
    console.log('👤 Adding 3 new guests...');

    const newUsers = await prisma.user.createMany({
        data: [
            {
                id: uuid(),
                email: `extra_guest_1@example.com`,
                name: `Extra Guest 1`,
                isGuest: true,
            },
            {
                id: uuid(),
                email: `extra_guest_2@example.com`,
                name: `Extra Guest 2`,
                isGuest: true,
            },
            {
                id: uuid(),
                email: `extra_guest_3@example.com`,
                name: `Extra Guest 3`,
                isGuest: true,
            },
        ],
    });

    // 作成したユーザーを取得
    const createdUsers = await prisma.user.findMany({
        where: { email: { contains: 'extra_guest_' } },
    });

    // Guest レコード作成
    await prisma.guest.createMany({
        data: createdUsers.map((u) => ({
            id: uuid(),
            userId: u.id,
            profession: 'Freelance Stylist',
        })),
    });

    console.log('✅ Added 3 guests successfully');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
