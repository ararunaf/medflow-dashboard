import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { logSsrAndAudit } from "./lib/monitoring/channels/ssr";
import { initServerErrorMonitoring } from "./lib/monitoring/server-bootstrap";
import { applySecurityHeadersTo } from "./lib/security/csp";

initServerErrorMonitoring();

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    void logSsrAndAudit("ssr_middleware_error", { err: error, message });
    const isProduction = typeof import.meta !== "undefined" && import.meta.env.PROD === true;
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    applySecurityHeadersTo(headers, isProduction);
    return new Response(renderErrorPage(), { status: 500, headers });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
