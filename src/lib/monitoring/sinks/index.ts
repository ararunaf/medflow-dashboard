import { registerMonitorSink } from "../emit";
import { consoleMonitorSink } from "./console";
import { createErrorTrackerSink } from "./error-tracker";

let bootstrapped = false;

/** Registra sinks padrão (console + error tracking opcional). Idempotente. */
export function bootstrapDefaultMonitorSinks(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  registerMonitorSink(consoleMonitorSink);

  const errorTracker = createErrorTrackerSink();
  if (errorTracker) registerMonitorSink(errorTracker);
}
