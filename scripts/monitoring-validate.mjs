#!/usr/bin/env node
/**
 * Valida estrutura e wiring de monitoramento:
 * runtime, SSR, auth e error tracking (sinks + touchpoints).
 *
 * Uso: npm run monitoring-validate
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src");

function read(rel) {
  const p = rel.startsWith("src/") ? join(root, rel) : join(src, rel);
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

function mustExist(rel, label) {
  const p = rel.startsWith("src/") ? join(root, rel) : join(src, rel);
  if (existsSync(p)) ok(label);
  else fail(label, `arquivo ausente: ${rel}`);
}

console.log("\n[medflow] monitoring-validate\n");

// ── Estrutura base ──
console.log("── Estrutura (lib/monitoring)\n");

mustExist("lib/monitoring/index.ts", "monitoring/index.ts");
mustExist("lib/monitoring/types.ts", "monitoring/types.ts");
mustExist("lib/monitoring/emit.ts", "monitoring/emit.ts");
mustExist("lib/monitoring/registry.ts", "monitoring/registry.ts");
mustExist("lib/monitoring/channels/runtime.ts", "channel runtime");
mustExist("lib/monitoring/channels/ssr.ts", "channel ssr");
mustExist("lib/monitoring/channels/auth.ts", "channel auth");
mustExist("lib/monitoring/channels/client.ts", "channel client");
mustExist("lib/monitoring/sinks/console.ts", "sink console");
mustExist("lib/monitoring/sinks/error-tracker.ts", "sink error-tracker");
mustExist("lib/monitoring/sinks/index.ts", "sinks index");

mustInclude("lib/monitoring/types.ts", '"runtime"', "Tipo MonitorChannel runtime");
mustInclude("lib/monitoring/types.ts", '"ssr"', "Tipo MonitorChannel ssr");
mustInclude("lib/monitoring/types.ts", '"auth"', "Tipo MonitorChannel auth");
mustInclude("lib/monitoring/types.ts", '"client"', "Tipo MonitorChannel client");
mustInclude("lib/monitoring/emit.ts", "registerMonitorSink", "API registerMonitorSink");
mustInclude("lib/monitoring/registry.ts", "MONITORING_REGISTRY", "Manifesto MONITORING_REGISTRY");
mustInclude("lib/monitoring/registry.ts", "errorTracking", "Pilar errorTracking no registry");
mustInclude("lib/monitoring/index.ts", "MONITORING_REGISTRY", "Export registry no index");

// ── Runtime monitoring ──
console.log("\n── Runtime monitoring\n");

mustInclude("lib/error-capture.ts", "logRuntime", "error-capture logRuntime");
mustInclude("lib/error-capture.ts", "uncaught_exception", "evento uncaught_exception");
mustInclude("lib/error-capture.ts", "initServerErrorMonitoring", "error-capture bootstrap server");
mustInclude("server.ts", "lib/error-capture", "server importa error-capture");
mustInclude("lib/monitoring/registry.ts", "runtime", "Registry pilar runtime");

// ── SSR monitoring ──
console.log("\n── SSR monitoring\n");

mustInclude("start.ts", "logSsrAndAudit", "start.ts logSsrAndAudit");
mustInclude("start.ts", "ssr_middleware_error", "evento ssr_middleware_error");
mustInclude("server.ts", "logSsrAndAudit", "server.ts logSsrAndAudit");
mustInclude("server.ts", "ssr_catastrophic", "evento ssr_catastrophic");
mustInclude("server.ts", "ssr_worker_uncaught", "evento ssr_worker_uncaught");
mustInclude("server.ts", "normalizeCatastrophicSsrResponse", "normalização SSR catastrófico");
mustInclude("lib/monitoring/channels/ssr.ts", "logSsrAndAudit", "canal SSR com audit");
mustInclude("lib/monitoring/registry.ts", "ssr_catastrophic", "Registry eventos SSR");

// ── Auth monitoring ──
console.log("\n── Auth monitoring\n");

mustInclude("lib/monitoring/channels/auth.ts", "logAuthAndAudit", "canal auth logAuthAndAudit");
mustInclude("lib/auth/get-auth-context.ts", "logAuthAndAudit", "getAuthContext usa monitoramento");
mustInclude("lib/auth/get-auth-context.ts", "get_user_failed", "evento get_user_failed");
mustInclude("server.ts", "logAuthAndAudit", "server auth monitoring");
mustInclude("server.ts", "login_page_rate_limited", "rate limit login auditado");
mustInclude("lib/errors/create-query-client.ts", "logAuth", "query client logAuth");
mustInclude("lib/monitoring/registry.ts", "auth", "Registry pilar auth");

// ── Error tracking (client + sinks) ──
console.log("\n── Error tracking\n");

mustInclude("lib/monitoring/client-bootstrap.ts", "initClientErrorMonitoring", "bootstrap client");
mustInclude("lib/monitoring/client-bootstrap.ts", "window_error", "evento window_error");
mustInclude("lib/monitoring/client-bootstrap.ts", "unhandled_rejection", "evento unhandled_rejection");
mustInclude("routes/__root.tsx", "initClientErrorMonitoring", "root init client monitoring");
mustInclude("components/global-error-boundary.tsx", "logClient", "boundary logClient");
mustInclude("routes/__root.tsx", "route_error_component", "route error logClient");
mustInclude("lib/monitoring/sinks/console.ts", "[medflow_monitor]", "prefixo console sink");
mustInclude("lib/monitoring/sinks/index.ts", "createErrorTrackerSink", "bootstrap error-tracker sink");
mustInclude("lib/monitoring/sinks/error-tracker.ts", "MEDFLOW_ERROR_TRACKING_DSN", "env server DSN");
mustInclude("lib/monitoring/sinks/error-tracker.ts", "VITE_MEDFLOW_ERROR_TRACKING_DSN", "env client DSN");

const envExample = existsSync(join(root, ".env.example"))
  ? readFileSync(join(root, ".env.example"), "utf8")
  : "";
if (
  envExample.includes("MEDFLOW_ERROR_TRACKING_DSN") ||
  envExample.includes("VITE_MEDFLOW_ERROR_TRACKING_DSN")
) {
  ok(".env.example documenta DSN de error tracking");
} else {
  fail(".env.example documenta DSN de error tracking", "adicione MEDFLOW_ERROR_TRACKING_DSN");
}

// ── Touchpoints do registry ──
console.log("\n── Touchpoints (registry)\n");

const registryBody = read("lib/monitoring/registry.ts");
const touchpointRe = /file:\s*"([^"]+)"[\s\S]*?marker:\s*"([^"]+)"/g;
let touchMatch;
let touchFailed = 0;
while ((touchMatch = touchpointRe.exec(registryBody)) !== null) {
  const [, file, marker] = touchMatch;
  const body = read(file);
  const label = `touchpoint ${file} → ${marker}`;
  if (body.includes(marker)) ok(label);
  else {
    fail(label, `marker não encontrado`);
    touchFailed++;
  }
}

if (!registryBody.includes("touchpoints")) {
  fail("Registry define touchpoints", "ausente");
}

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

console.log("[medflow] monitoring emit behavior\n");

const harness = join(__dirname, "monitoring-emit-behavior.harness.mjs");
const behavior = spawnSync(
  "npx",
  ["vite-node", harness],
  { cwd: root, encoding: "utf8", shell: true },
);

if (behavior.stdout) process.stdout.write(behavior.stdout);
if (behavior.stderr) process.stderr.write(behavior.stderr);

if (behavior.status !== 0) {
  console.log("\n  Falha nos testes comportamentais de emit/sinks.\n");
  process.exit(1);
}

console.log("  Monitoramento validado (estático + emit).\n");
process.exit(0);
