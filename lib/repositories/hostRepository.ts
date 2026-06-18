import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEMO_HOST_ID = process.env.DEMO_HOST_ID;

/**
 * Host identity. No auth yet, so we resolve the demo host (the first one
 * created). Replace with the authenticated host once sessions land.
 */
export const getCurrentHost = cache(async function getCurrentHost() {
  return prisma.host.findFirst({
    ...(DEMO_HOST_ID ? { where: { id: DEMO_HOST_ID } } : {}),
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
});

export const getCurrentHostWithAddress = cache(async function getCurrentHostWithAddress() {
  const host = await prisma.host.findFirst({
    ...(DEMO_HOST_ID ? { where: { id: DEMO_HOST_ID } } : {}),
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
  if (!host) return null;

  return {
    ...host,
    address: {
      zipcode: host.zipcode ?? "",
      prefecture: host.prefecture ?? "",
      city: host.city ?? "",
      town: host.town ?? "",
      building: host.building ?? "",
    },
  };
});

/** Update a host's profile (name/email live on `users`). */
export async function updateHostProfile(params: {
  hostId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  building: string;
  lat: number | null;
  lng: number | null;
}) {
  const opt = (value: string) => (value.trim() ? value.trim() : null);
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: params.userId },
      data: {
        name: params.name,
        email: params.email,
        phone: opt(params.phone),
      },
    }),
    prisma.$executeRawUnsafe(
      `update public.hosts
          set zipcode = $2,
              prefecture = $3,
              city = $4,
              town = $5,
              building = $6,
              lat = $7,
              lng = $8
        where id = $1::uuid`,
      params.hostId,
      opt(params.zipcode),
      opt(params.prefecture),
      opt(params.city),
      opt(params.town),
      opt(params.building),
      params.lat,
      params.lng,
    ),
  ]);
  return user;
}

export type HostAddress = {
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  building: string;
};

export async function getHostAddress(hostId: string): Promise<HostAddress> {
  const rows = await prisma.$queryRawUnsafe<HostAddress[]>(
    `select
        coalesce(zipcode, '') as zipcode,
        coalesce(prefecture, '') as prefecture,
        coalesce(city, '') as city,
        coalesce(town, '') as town,
        coalesce(building, '') as building
      from public.hosts
      where id = $1::uuid`,
    hostId,
  );
  return (
    rows[0] ?? {
      zipcode: "",
      prefecture: "",
      city: "",
      town: "",
      building: "",
    }
  );
}
