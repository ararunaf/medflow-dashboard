/**
 * PoC Application — depende apenas de AIProviderRuntimePort (ARCH-02 / DIP-07).
 */
import type { AIProviderRuntimePort } from "../ports/ai-provider-runtime-port";
import type { AIProviderRuntimeCapabilities, AIProviderRuntimeHealth } from "../ports/types";

export type AIProviderRuntimeHealthSummary = {
  health: AIProviderRuntimeHealth;
  capabilities: AIProviderRuntimeCapabilities;
  architectureLayer: "application";
};

export async function getAIProviderRuntimeHealthSummary(
  port: AIProviderRuntimePort,
): Promise<AIProviderRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
