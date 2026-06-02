import { bootstrapDefaultMonitorSinks } from "./sinks";
import { logClient } from "./channels/client";

let initialized = false;

/**
 * Registra listeners globais no browser (erros não tratados e rejeições de Promise).
 * Chamar uma vez no root da aplicação (client).
 */
export function initClientErrorMonitoring(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  bootstrapDefaultMonitorSinks();

  window.addEventListener("error", (event) => {
    logClient("window_error", {
      err: event.error ?? event.message,
      message: event.message || "window error",
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logClient("unhandled_rejection", {
      err: event.reason,
      message: "unhandled promise rejection",
    });
  });
}
