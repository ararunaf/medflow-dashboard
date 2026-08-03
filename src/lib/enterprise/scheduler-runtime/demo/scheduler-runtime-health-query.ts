/**
 * PoC Application — depende apenas de SchedulerRuntimePort (INF-07).
 */
import type { SchedulerRuntimePort } from "../ports/scheduler-runtime-port";
import type {
  SchedulerRuntimeHealth,
  SchedulerRuntimeInfo,
  SchedulerRuntimePortCapabilities,
} from "../ports/types";

export type SchedulerRuntimeHealthSummary = {
  health: SchedulerRuntimeHealth;
  capabilities: SchedulerRuntimePortCapabilities;
  info: SchedulerRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Consulta estrutural de saúde — camada Application.
 * Depende exclusivamente do Port (sem Adapter/Store/Factory).
 */
export async function getSchedulerRuntimeHealthSummary(
  port: SchedulerRuntimePort,
): Promise<SchedulerRuntimeHealthSummary> {
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
