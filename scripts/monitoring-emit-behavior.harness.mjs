/**
 * Testa emitMonitor + sinks sem browser (vite-node).
 */
import assert from "node:assert/strict";
import { emitMonitor, registerMonitorSink } from "../src/lib/monitoring/emit.ts";
import { bootstrapDefaultMonitorSinks } from "../src/lib/monitoring/sinks/index.ts";
import { logRuntime } from "../src/lib/monitoring/channels/runtime.ts";
import { logSsr } from "../src/lib/monitoring/channels/ssr.ts";
import { logAuth } from "../src/lib/monitoring/channels/auth.ts";
import { logClient } from "../src/lib/monitoring/channels/client.ts";
import { MONITORING_REGISTRY } from "../src/lib/monitoring/registry.ts";

const captured = [];

registerMonitorSink((payload) => {
  captured.push(payload);
});

bootstrapDefaultMonitorSinks();

logRuntime("test_runtime", { message: "runtime ok" });
logSsr("ssr_middleware_error", { message: "ssr ok" });
logAuth("test_auth", { message: "auth ok", level: "warn" });
logClient("test_client", { message: "client ok" });

emitMonitor({
  channel: "client",
  level: "error",
  event: "direct_emit",
  message: "direct",
});

const channels = new Set(captured.map((p) => p.channel));
assert.ok(channels.has("runtime"), "runtime channel");
assert.ok(channels.has("ssr"), "ssr channel");
assert.ok(channels.has("auth"), "auth channel");
assert.ok(channels.has("client"), "client channel");

for (const payload of captured) {
  assert.ok(payload.timestamp, "timestamp");
  assert.ok(payload.message, "message");
  assert.equal(typeof payload.event, "string");
}

assert.ok(MONITORING_REGISTRY.runtime.channel === "runtime");
assert.ok(MONITORING_REGISTRY.ssr.events.includes("ssr_catastrophic"));
assert.ok(MONITORING_REGISTRY.errorTracking.touchpoints.length >= 4);

console.log(`  ✓ ${captured.length} payloads emitidos nos 4 canais`);
console.log("  ✓ MONITORING_REGISTRY legível");
