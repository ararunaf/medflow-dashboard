#!/usr/bin/env node
/**
 * Valida presença, wiring e comportamento do error handling
 * (boundary, SSR, auth, fetch/network, tenant, fallbacks, navegação).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src");

function read(rel) {
  const p = join(src, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

const checks = [];

function ok(label) {
  checks.push({ label, pass: true });
}

function fail(label, detail) {
  checks.push({ label, pass: false, detail });
}

function mustInclude(file, needle, label) {
  const body = read(file);
  if (body.includes(needle)) ok(label);
  else fail(label, `ausente em ${file}`);
}

console.log("\n[medflow] error-handling-validate\n");

mustInclude("components/global-error-boundary.tsx", "classifyError", "Global error boundary");
mustInclude("components/offline-fallback.tsx", "useOnlineStatus", "Offline fallback");
mustInclude("components/auth-fallback.tsx", "LOGIN_REASON_MESSAGES", "Auth fallback");
mustInclude("components/route-pending-fallback.tsx", "Carregando", "Route pending fallback");
mustInclude("lib/errors/create-query-client.ts", "MutationCache", "Query client global onError");
mustInclude("lib/errors/classify.ts", "session_expired", "Error classify");
mustInclude("lib/monitoring/types.ts", "runtime", "Monitor channels");
mustInclude("lib/monitoring/channels/ssr.ts", "logSsrAndAudit", "SSR monitor + audit");
mustInclude("lib/monitoring/channels/auth.ts", "logAuthAndAudit", "Auth monitor + audit");
mustInclude("lib/monitoring/client-bootstrap.ts", "unhandledrejection", "Client global listeners");
mustInclude("lib/error-page.ts", "pt-BR", "SSR error page PT-BR");
mustInclude("routes/__root.tsx", "GlobalErrorBoundary", "Root wires error boundary");
mustInclude("routes/__root.tsx", "OfflineFallback", "Root wires offline");
mustInclude("routes/__root.tsx", "RoutePendingFallback", "Root pending component");
mustInclude("components/auth-sync.tsx", "redirectToLoginWithReason", "Auth sync redirect");
mustInclude("routes/login.tsx", "AuthFallback", "Login auth fallback");
mustInclude("router.tsx", "createAppQueryClient", "Router app query client");

const server = readFileSync(join(root, "src/server.ts"), "utf8");
if (server.includes("renderErrorPage") && server.includes("normalizeCatastrophicSsrResponse")) {
  ok("SSR catastrophic fallback");
} else {
  fail("SSR catastrophic fallback", "server.ts");
}

if (server.includes("logSsrAndAudit")) {
  ok("Server SSR monitoring");
} else {
  fail("Server SSR monitoring", "server.ts");
}

const start = readFileSync(join(root, "src/start.ts"), "utf8");
if (start.includes("renderErrorPage") && start.includes("errorMiddleware")) {
  ok("Start middleware SSR fallback");
} else {
  fail("Start middleware SSR fallback", "start.ts");
}

if (start.includes("logSsrAndAudit")) {
  ok("Start SSR monitoring");
} else {
  fail("Start SSR monitoring", "start.ts");
}

mustInclude("routes/__root.tsx", "initClientErrorMonitoring", "Root client monitoring bootstrap");
mustInclude("components/global-error-boundary.tsx", "logClient", "Boundary client monitoring");
mustInclude("lib/errors/create-query-client.ts", "logAuth", "Query client auth monitoring");

let failed = 0;
for (const c of checks) {
  if (c.pass) console.log(`  ✓ ${c.label}`);
  else {
    console.log(`  ✗ ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
    failed++;
  }
}

console.log(failed ? `\n  ${failed} falha(s) estática(s)\n` : "\n  Checagens estáticas OK.\n");

if (failed) {
  process.exit(1);
}

console.log("[medflow] error-boundaries behavior\n");

const harness = join(__dirname, "error-boundaries-behavior.harness.mjs");
const behavior = spawnSync(
  "npx",
  ["vite-node", harness],
  { cwd: root, encoding: "utf8", shell: true },
);

if (behavior.stdout) process.stdout.write(behavior.stdout);
if (behavior.stderr) process.stderr.write(behavior.stderr);

if (behavior.status !== 0) {
  console.log("\n  Falha nos testes comportamentais de error boundaries.\n");
  process.exit(1);
}

console.log("  Error boundaries validados (estático + comportamento).\n");
process.exit(0);
