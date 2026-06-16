import { prisma } from "@/lib/prisma";
import type { Availability } from "@/types";
import type { Prisma } from "@prisma/client";

/** A space's recurring availability rules. */
export async function getAvailabilities(spaceId: string) {
  return prisma.availability.findMany({
    where: { spaceId },
    orderBy: { createdAt: "asc" },
  });
}

/** UI-ready availability rules. Keeps DB time '24:00' as a string. */
export async function getUIAvailabilities(spaceId: string): Promise<Availability[]> {
  return prisma.$queryRawUnsafe<Availability[]>(
    `select
        id::text as "id",
        space_id::text as "spaceId",
        coalesce(bookable_level, 'both') as "bookableLevel",
        left(start_time::text, 5) as "startTime",
        left(end_time::text, 5) as "endTime",
        repeat_type as "repeatType",
        case
          when end_date is null then null
          else to_char(end_date, 'YYYY-MM-DD')
        end as "repeatUntil",
        day_of_week as "daysOfWeek",
        coalesce(
          array(select to_char(d, 'YYYY-MM-DD') from unnest(exception_dates) as d),
          array[]::text[]
        ) as "exceptions"
      from public.availabilities
      where space_id = $1::uuid
        and is_active is true
      order by created_at asc`,
    spaceId,
  );
}

export async function createAvailability(
  data: Prisma.AvailabilityUncheckedCreateInput,
) {
  return prisma.availability.create({ data });
}

export async function createAvailabilityRule(data: {
  spaceId: string;
  bookableLevel?: "seat" | "space" | "both" | "closed";
  repeatType: string;
  startDate: string;
  endDate: string | null;
  startTime: string;
  endTime: string;
  dayOfWeek: number[];
  exceptionDates: string[];
}) {
  return prisma.$executeRawUnsafe(
    `insert into public.availabilities
      (space_id, bookable_level, repeat_type, start_date, end_date, start_time, end_time, day_of_week, exception_dates, is_active)
     values
      ($1::uuid, $2, $3, $4::date, $5::date, $6::time, $7::time, $8::int[], $9::date[], true)`,
    data.spaceId,
    data.bookableLevel ?? "both",
    data.repeatType,
    data.startDate,
    data.endDate,
    data.startTime,
    data.endTime,
    data.dayOfWeek,
    data.exceptionDates,
  );
}

export async function updateAvailability(
  id: string,
  data: Prisma.AvailabilityUncheckedUpdateInput,
) {
  return prisma.availability.update({ where: { id }, data });
}

export async function updateAvailabilityRule(
  id: string,
  data: {
    bookableLevel?: "seat" | "space" | "both" | "closed";
    repeatType: string;
    endDate: string | null;
    startTime: string;
    endTime: string;
    dayOfWeek: number[];
    exceptionDates: string[];
  },
) {
  return prisma.$executeRawUnsafe(
    `update public.availabilities
        set repeat_type = $2,
            bookable_level = $3,
            end_date = $4::date,
            start_time = $5::time,
            end_time = $6::time,
            day_of_week = $7::int[],
            exception_dates = $8::date[],
            is_active = true
      where id = $1::uuid`,
    id,
    data.repeatType,
    data.bookableLevel ?? "both",
    data.endDate,
    data.startTime,
    data.endTime,
    data.dayOfWeek,
    data.exceptionDates,
  );
}

export async function deleteAvailability(id: string) {
  return prisma.availability.delete({ where: { id } });
}
