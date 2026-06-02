import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { logAuthAndAudit } from "./lib/monitoring/channels/auth";
import { logSsrAndAudit } from "./lib/monitoring/channels/ssr";
import { initServerErrorMonitoring } from "./lib/monitoring/server-bootstrap";
import { securityHeaders } from "./lib/security/csp";
import { checkRateLimit, rateLimitKey } from "./lib/security/rate-limit";
import { getClientIpFromRequest } from "./lib/security/request-client";
import { logStartupDiagnostics } from "./lib/env/startup-diagnostics";
import { isHealthPath, resolveHealthResponse } from "./lib/server/health-checks";

initServerErrorMonitoring();

let startupLogged = false;
function logStartupOnce() {
  if (startupLogged) return;
  startupLogged = true;
  logStartupDiagnostics("server");
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  const err = consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`);
  void logSsrAndAudit("ssr_catastrophic", {
    err,
    message: err instanceof Error ? err.message : String(err),
    metadata: { status: response.status, body_preview: body.slice(0, 200) },
  });
  return brandedErrorResponse();
}

function applySecurityHeaders(response: Response, isProduction: boolean): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders(isProduction))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function loginPageRateLimitResponse(isProduction: boolean, retryAfterMs: number): Response {
  const retrySec = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return applySecurityHeaders(
    new Response(
      `Muitas requisições à página de login. Tente novamente em ${retrySec} segundo(s).`,
      {
        status: 429,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "Retry-After": String(retrySec),
        },
      },
    ),
    isProduction,
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    logStartupOnce();
    const isProduction = typeof import.meta !== "undefined" && import.meta.env.PROD === true;

    const url = new URL(request.url);
    if (isHealthPath(url.pathname)) {
      const healthResponse = await resolveHealthResponse(url.pathname);
      return applySecurityHeaders(healthResponse, isProduction);
    }

    if (url.pathname === "/login") {
      const ip = getClientIpFromRequest(request);
      const rl = checkRateLimit(rateLimitKey(ip, "page_login"), {
        max: 80,
        windowMs: 60_000,
      });
      if (!rl.allowed) {
        void logAuthAndAudit({
          category: "login_attempt",
          eventType: "login_page_rate_limited",
          outcome: "blocked",
          ip,
          metadata: { path: "/login" },
        });
        return loginPageRateLimitResponse(isProduction, rl.retryAfterMs ?? 60_000);
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized, isProduction);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void logSsrAndAudit("ssr_worker_uncaught", {
        err: error,
        message,
        metadata: { path: url.pathname },
      });
      return applySecurityHeaders(brandedErrorResponse(), isProduction);
    }
  },
};
