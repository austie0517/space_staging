import type { Availability, RepeatType } from "@/types";
import type { Availability as PrismaAvailability } from "@prisma/client";

const pad = (n: number) => String(n).padStart(2, "0");

// Postgres `time` / `date` come back as Dates anchored at the UTC epoch; read UTC.
export const timeToHHMM = (d: Date) =>
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
export const dateToYMD = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export const hhmmToDate = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00Z`);
export const ymdToDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

/** Map a Prisma `Availability` to the UI `Availability` shape. */
export function toUIAvailability(a: PrismaAvailability): Availability {
  const startTime = timeToHHMM(a.startTime);
  const rawEndTime = timeToHHMM(a.endTime);
  const endTime = rawEndTime === "00:00" && startTime > "00:00" ? "24:00" : rawEndTime;

  return {
    id: a.id,
    spaceId: a.spaceId,
    bookableLevel: a.bookableLevel as Availability["bookableLevel"],
    startTime,
    endTime,
    repeatType: a.repeatType as RepeatType,
    repeatUntil: a.endDate ? dateToYMD(a.endDate) : undefined,
    daysOfWeek: a.dayOfWeek ?? [],
    exceptions: (a.exceptionDates ?? []).map(dateToYMD),
  };
}
