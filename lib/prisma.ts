import { PrismaClient } from "@prisma/client";

// Next.js dev hot-reload would otherwise spawn a new client per reload and
// exhaust the Supabase connection pool. Reuse a single instance via globalThis.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
