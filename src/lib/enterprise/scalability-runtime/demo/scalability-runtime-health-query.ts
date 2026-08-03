/**
 * PoC Application — depende apenas de ScalabilityRuntimePort (INF-10).
 */
import type { ScalabilityRuntimePort } from "../ports/scalability-runtime-port";
import type {
  ScalabilityRuntimeHealth,
  ScalabilityRuntimeInfo,
  ScalabilityRuntimePortCapabilities,
} from "../ports/types";

export type ScalabilityRuntimeHealthSummary = {
  health: ScalabilityRuntimeHealth;
  capabilities: ScalabilityRuntimePortCapabilities;
  info: ScalabilityRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Consulta estrutural de saúde — camada Application.
 * Depende exclusivamente do Port (sem Adapter/Store/Factory).
 */
export async function getScalabilityRuntimeHealthSummary(
  port: ScalabilityRuntimePort,
): Promise<ScalabilityRuntimeHealthSummary> {
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
