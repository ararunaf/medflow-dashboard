/**
 * PoC Application — depende apenas de StoragePort (EPC-02).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, OCR ou Captura.
 * Serve exclusivamente para provar Application → Port → Adapter.
 */
import type { StoragePort } from "../ports/storage-port";
import type { StorageCapabilities, StorageHealth } from "../ports/types";

export type StorageHealthSummary = {
  health: StorageHealth;
  capabilities: StorageCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de Supabase Storage / buckets / vendors.
 */
export async function getStorageHealthSummary(port: StoragePort): Promise<StorageHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
