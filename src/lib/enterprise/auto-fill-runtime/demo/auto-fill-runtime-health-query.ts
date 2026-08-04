/**
 * PoC Application — depende apenas de AutoFillRuntimePort (F3-CAP-12).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA,
 * preenchimento automático funcional, operadoras ou XML.
 */
import type { AutoFillRuntimePort } from "../ports/auto-fill-runtime-port";
import type {
  AutoFillRuntimeCapabilities,
  AutoFillRuntimeHealth,
  AutoFillRuntimeInfo,
} from "../ports/types";

export type AutoFillRuntimeHealthSummary = {
  health: AutoFillRuntimeHealth;
  capabilities: AutoFillRuntimeCapabilities;
  info: AutoFillRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de preenchimento automático / operadoras / XML / escrita em guias.
 */
export async function getAutoFillRuntimeHealthSummary(
  port: AutoFillRuntimePort,
): Promise<AutoFillRuntimeHealthSummary> {
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
