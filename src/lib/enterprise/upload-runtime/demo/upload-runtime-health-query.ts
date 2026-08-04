/**
 * PoC Application — depende apenas de UploadRuntimePort (F3-CAP-03).
 *
 * Não é usado por rotas, Server Functions, UI, upload, Scanner físico,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { UploadRuntimePort } from "../ports/upload-runtime-port";
import type {
  UploadRuntimeHealth,
  UploadRuntimeInfo,
  UploadRuntimePortCapabilities,
} from "../ports/types";

export type UploadRuntimeHealthSummary = {
  health: UploadRuntimeHealth;
  capabilities: UploadRuntimePortCapabilities;
  info: UploadRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de Scanner real / Local / Network / UNC / SMB / Azure Files / watchers.
 */
export async function getUploadRuntimeHealthSummary(
  port: UploadRuntimePort,
): Promise<UploadRuntimeHealthSummary> {
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
