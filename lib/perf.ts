export async function measure<T>(label: string, run: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await run();
  } finally {
    const duration = Math.round(performance.now() - start);
    if (process.env.NODE_ENV === "development") {
      console.log(`[perf] ${label}: ${duration}ms`);
    }
  }
}
