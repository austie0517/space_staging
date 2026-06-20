const enablePerfLogging =
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_PROD_PERF_LOGS === "true";

export async function measure<T>(label: string, run: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await run();
  } finally {
    const duration = Math.round(performance.now() - start);
    if (enablePerfLogging) {
      console.log(`[perf] ${label}: ${duration}ms`);
    }
  }
}
