/**
 * Factory do Bloco F — Integration Engine.
 *
 * Resolve Default ou Mock via registry. Sem fallback silencioso.
 */
import { DefaultIntegrationEngineAdapter } from "../adapters";
import { MockIntegrationEngineAdapter } from "../adapters";
import { integrationEngineRegistry } from "../registry";
import type { IntegrationEnginePort } from "../ports";

export function createIntegrationEnginePort(
  provider: "default" | "mock" = "default",
): IntegrationEnginePort {
  const entry = integrationEngineRegistry.get(provider);
  if (!entry) {
    throw new Error(`Unknown Integration Engine provider: ${provider}`);
  }
  return entry.create();
}

export function getIntegrationEnginePort(
  provider: "default" | "mock" = "default",
): IntegrationEnginePort {
  return createIntegrationEnginePort(provider);
}
