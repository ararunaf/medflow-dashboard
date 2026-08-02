/**
 * PoC Application — depende apenas de TISSRuntimePort (TISS-01).
 */
import type { TISSRuntimePort } from "../ports/tiss-runtime-port";
import type { TISSRuntimeCapabilities, TISSRuntimeHealth } from "../ports/types";

export type TISSRuntimeHealthSummary = {
  health: TISSRuntimeHealth;
  capabilities: TISSRuntimeCapabilities;
  architectureLayer: "application";
};

export async function getTISSRuntimeHealthSummary(
  port: TISSRuntimePort,
): Promise<TISSRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
