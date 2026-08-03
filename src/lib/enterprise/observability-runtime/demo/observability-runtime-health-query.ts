/**
 * PoC Application — depende apenas de ObservabilityRuntimePort (INF-09).
 */
import type { ObservabilityRuntimePort } from "../ports/observability-runtime-port";
import type {
  ObservabilityRuntimeHealth,
  ObservabilityRuntimeInfo,
  ObservabilityRuntimePortCapabilities,
} from "../ports/types";

export type ObservabilityRuntimeHealthSummary = {
  health: ObservabilityRuntimeHealth;
  capabilities: ObservabilityRuntimePortCapabilities;
  info: ObservabilityRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Consulta estrutural de saúde — camada Application.
 * Depende exclusivamente do Port (sem Adapter/Store/Factory).
 */
export async function getObservabilityRuntimeHealthSummary(
  port: ObservabilityRuntimePort,
): Promise<ObservabilityRuntimeHealthSummary> {
  const [health, capabilities, info] = await Promise.all([
    port.health(),
    Promise.resolve(port.capabilities()),
    Promise.resolve(port.providerInfo()),
  ]);
  return {
    health,
    capabilities,
    info,
    architectureLayer: "application",
  };
}
