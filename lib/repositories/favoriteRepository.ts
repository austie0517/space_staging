import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Same relations toUISpace needs, so favorited spaces map straight to UI.
const spaceInclude = {
  images: true,
  options: true,
  reviews: true,
  tagRelations: { include: { tag: true } },
} satisfies Prisma.SpaceInclude;

/** Space ids the user has favorited (for heart state across the app). */
export async function getFavoriteSpaceIds(userId: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ spaceId: string }>>(
    `select space_id::text as "spaceId"
       from public.favorites
      where user_id = $1::uuid`,
    userId,
  );
  return rows.map((r) => r.spaceId);
}

export async function getCurrentGuestFavoriteSpaceIds() {
  const rows = await prisma.$queryRawUnsafe<Array<{ spaceId: string }>>(
    process.env.DEMO_GUEST_ID
      ? `
        select f.space_id::text as "spaceId"
        from public.favorites f
        join public.guests g
          on g.user_id = f.user_id
        where g.id = $1::uuid
      `
      : `
        with current_guest as (
          select user_id
          from public.guests
          order by created_at asc
          limit 1
        )
        select f.space_id::text as "spaceId"
        from public.favorites f
        where f.user_id = (select user_id from current_guest)
      `,
    ...(process.env.DEMO_GUEST_ID ? [process.env.DEMO_GUEST_ID] : []),
  );
  return rows.map((row) => row.spaceId);
}

/** The user's favorited spaces, newest first (for /me/favorites). */
export async function getFavoriteSpaces(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { space: { include: spaceInclude } },
  });
  return rows.map((r) => r.space);
}

/** Toggle a favorite; returns the new favorited state. */
export async function toggleFavorite(userId: string, spaceId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_spaceId: { userId, spaceId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.favorite.create({ data: { userId, spaceId } });
  return true;
}
