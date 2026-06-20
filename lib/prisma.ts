import { PrismaClient } from "@prisma/client";

// Next.js dev hot-reload would otherwise spawn a new client per reload and
// exhaust the Supabase connection pool. Reuse a single instance via globalThis.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getRuntimeDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    const isSupabasePooler = url.hostname.endsWith(".pooler.supabase.com");

    if (!isSupabasePooler) {
      return raw;
    }

    // Vercel/serverless traffic should use Supabase's transaction pooler.
    // If the env accidentally points at the session pooler, normalize it here.
    if (url.port === "5432") {
      url.port = "6543";
    }

    if (!url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }

    // Keep each serverless instance conservative with pooled connections.
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }

    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }

    return url.toString();
  } catch {
    return raw;
  }
}

const runtimeDatabaseUrl = getRuntimeDatabaseUrl();
const enableQueryPerfLogging = process.env.NODE_ENV === "development";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(runtimeDatabaseUrl
      ? {
          datasources: {
            db: { url: runtimeDatabaseUrl },
          },
        }
      : {}),
    log: enableQueryPerfLogging
      ? [{ emit: "event", level: "query" }, "error", "warn"]
      : ["error"],
  });

if (enableQueryPerfLogging) {
  (prisma as PrismaClient & {
    $on: (eventType: "query", callback: (event: {
      duration: number;
      query: string;
    }) => void) => void;
  }).$on("query", (event) => {
    if (event.duration < 150) return;
    const query = event.query.replace(/\s+/g, " ").trim().slice(0, 240);
    console.log(`[prisma] ${event.duration}ms ${query}`);
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
