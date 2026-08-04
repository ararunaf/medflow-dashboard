/**
 * PoC Application — depende apenas de WatchFolderRuntimePort (F3-CAP-02).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner físico,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { WatchFolderRuntimePort } from "../ports/watch-folder-runtime-port";
import type {
  WatchFolderRuntimeHealth,
  WatchFolderRuntimeInfo,
  WatchFolderRuntimePortCapabilities,
} from "../ports/types";

export type WatchFolderRuntimeHealthSummary = {
  health: WatchFolderRuntimeHealth;
  capabilities: WatchFolderRuntimePortCapabilities;
  info: WatchFolderRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de Scanner real / Local / Network / UNC / SMB / Azure Files / watchers.
 */
export async function getWatchFolderRuntimeHealthSummary(
  port: WatchFolderRuntimePort,
): Promise<WatchFolderRuntimeHealthSummary> {
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
