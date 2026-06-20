import { PrismaClient } from "@prisma/client";

// Next.js dev hot-reload would otherwise spawn a new client per reload and
// exhaust the Supabase connection pool. Reuse a single instance via globalThis.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaConnectPromise?: Promise<void>;
};

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

    // One pooled connection keeps instances conservative, but it also forces
    // Prisma queries inside Promise.all(...) to serialize on a single lane.
    // Allow a few connections by default so page-level parallel reads can
    // actually run in parallel. Override explicitly via env when needed.
    const defaultConnectionLimit =
      process.env.PRISMA_CONNECTION_LIMIT ??
      (process.env.NODE_ENV === "production" ? "3" : "6");

    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", defaultConnectionLimit);
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
const enablePerfLogging =
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_PROD_PERF_LOGS === "true";
const enableQueryPerfLogging = enablePerfLogging;

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

export async function ensurePrismaConnected() {
  if (!globalForPrisma.prismaConnectPromise) {
    const startedAt = Date.now();
    globalForPrisma.prismaConnectPromise = prisma
      .$connect()
      .then(() => {
        if (enablePerfLogging) {
          console.log(`[prisma] connect ${Date.now() - startedAt}ms`);
        }
      })
      .catch((error) => {
        globalForPrisma.prismaConnectPromise = undefined;
        throw error;
      });
  }

  await globalForPrisma.prismaConnectPromise;
}

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
void ensurePrismaConnected().catch((error) => {
  console.error("[prisma] initial connect failed:", error);
});

export default prisma;
