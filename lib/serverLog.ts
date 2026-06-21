function isTruthy(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export const isPerfLoggingEnabled =
  process.env.NODE_ENV === "development" || isTruthy(process.env.ENABLE_PROD_PERF_LOGS);

export function writeServerLog(message: string, level: "info" | "error" = "info") {
  const line = `${new Date().toISOString()} ${message}\n`;
  if (level === "error") {
    process.stderr.write(line);
    return;
  }
  process.stdout.write(line);
}
