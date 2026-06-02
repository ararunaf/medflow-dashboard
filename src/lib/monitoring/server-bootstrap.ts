import { bootstrapDefaultMonitorSinks } from "./sinks";

let initialized = false;

/** Inicializa sinks de monitoramento no runtime server/worker. Idempotente. */
export function initServerErrorMonitoring(): void {
  if (initialized) return;
  initialized = true;
  bootstrapDefaultMonitorSinks();
}
