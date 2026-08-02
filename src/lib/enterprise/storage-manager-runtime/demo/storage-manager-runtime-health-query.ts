/**
 * PoC Application — depende apenas de StorageManagerRuntimePort (DIP-05).
 *
 * Não é usado por rotas, Server Functions, UI, storage real, upload ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { StorageManagerRuntimePort } from "../ports/storage-manager-runtime-port";
import type {
  StorageManagerRuntimeCapabilities,
  StorageManagerRuntimeHealth,
} from "../ports/types";

export type StorageManagerRuntimeHealthSummary = {
  health: StorageManagerRuntimeHealth;
  capabilities: StorageManagerRuntimeCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 */
export async function getStorageManagerRuntimeHealthSummary(
  port: StorageManagerRuntimePort,
): Promise<StorageManagerRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
