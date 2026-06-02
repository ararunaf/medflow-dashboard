import { bootstrapDefaultMonitorSinks } from "./sinks";
import type { MonitorEnvironment, MonitorLevel, MonitorPayload, MonitorSink } from "./types";

const sinks: MonitorSink[] = [];
let defaultSinksReady = false;

function ensureDefaultSinks(): void {
  if (defaultSinksReady) return;
  defaultSinksReady = true;
  bootstrapDefaultMonitorSinks();
}

export function registerMonitorSink(sink: MonitorSink): () => void {
  sinks.push(sink);
  return () => {
    const index = sinks.indexOf(sink);
    if (index >= 0) sinks.splice(index, 1);
  };
}

function resolveEnvironment(): MonitorEnvironment {
  return typeof window === "undefined" ? "server" : "client";
}

function isDebugEnabled(): boolean {
  if (typeof import.meta === "undefined") return false;
  return import.meta.env?.DEV === true || import.meta.env?.VITE_MEDFLOW_DEBUG === "1";
}

function shouldEmitLevel(level: MonitorLevel): boolean {
  if (level === "error" || level === "warn") return true;
  return isDebugEnabled();
}

export function emitMonitor(
  payload: Omit<MonitorPayload, "timestamp" | "environment"> & {
    timestamp?: string;
    environment?: MonitorEnvironment;
  },
): void {
  if (!shouldEmitLevel(payload.level)) return;
  ensureDefaultSinks();

  const full: MonitorPayload = {
    ...payload,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    environment: payload.environment ?? resolveEnvironment(),
  };

  for (const sink of sinks) {
    try {
      sink(full);
    } catch {
      // sinks must never break the app
    }
  }
}
