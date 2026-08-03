/**
 * PoC Application — depende apenas de PersistentQueueRuntimePort (INF-08).
 */
import type { PersistentQueueRuntimePort } from "../ports/persistent-queue-runtime-port";
import type {
  PersistentQueueRuntimeHealth,
  PersistentQueueRuntimeInfo,
  PersistentQueueRuntimePortCapabilities,
} from "../ports/types";

export type PersistentQueueRuntimeHealthSummary = {
  health: PersistentQueueRuntimeHealth;
  capabilities: PersistentQueueRuntimePortCapabilities;
  info: PersistentQueueRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Consulta estrutural de saúde — camada Application.
 * Depende exclusivamente do Port (sem Adapter/Store/Factory).
 */
export async function getPersistentQueueRuntimeHealthSummary(
  port: PersistentQueueRuntimePort,
): Promise<PersistentQueueRuntimeHealthSummary> {
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
