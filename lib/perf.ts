import { isPerfLoggingEnabled, writeServerLog } from "@/lib/serverLog";

export async function measure<T>(label: string, run: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await run();
  } finally {
    const duration = Math.round(performance.now() - start);
    if (isPerfLoggingEnabled) {
      writeServerLog(`[perf] ${label}: ${duration}ms`);
    }
  }
}
