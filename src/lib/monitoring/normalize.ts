import type { NormalizedMonitorError } from "./types";

export function normalizeMonitorError(err: unknown): NormalizedMonitorError | undefined {
  if (err == null) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name || "Error",
      message: err.message || String(err),
      stack: err.stack,
    };
  }
  return { name: "Unknown", message: String(err) };
}

export function messageFromError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}
