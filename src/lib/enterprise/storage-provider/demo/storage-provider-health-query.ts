/**
 * PoC Application — depende apenas de StorageProviderPort (STORAGE-01).
 */
import type { StorageProviderPort } from "../ports/storage-provider-port";
import type {
  StorageProviderHealth,
  StorageProviderInfo,
  StorageProviderPortCapabilities,
} from "../ports/types";

export type StorageProviderHealthSummary = {
  health: StorageProviderHealth;
  capabilities: StorageProviderPortCapabilities;
  info: StorageProviderInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de Azure Blob / AWS S3 / GCS.
 */
export async function getStorageProviderHealthSummary(
  port: StorageProviderPort,
): Promise<StorageProviderHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  const info = port.providerInfo();
  return {
    health,
    capabilities,
    info,
    architectureLayer: "application",
  };
}
