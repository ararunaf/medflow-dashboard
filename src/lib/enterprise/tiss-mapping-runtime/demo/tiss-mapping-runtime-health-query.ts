/**
 * PoC Application — depende apenas de TISSMappingRuntimePort (F3-CAP-11).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA,
 * mapeamento TISS funcional, operadoras ou XML.
 */
import type { TISSMappingRuntimePort } from "../ports/tiss-mapping-runtime-port";
import type {
  TISSMappingRuntimeCapabilities,
  TISSMappingRuntimeHealth,
  TISSMappingRuntimeInfo,
} from "../ports/types";

export type TISSMappingRuntimeHealthSummary = {
  health: TISSMappingRuntimeHealth;
  capabilities: TISSMappingRuntimeCapabilities;
  info: TISSMappingRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de mapeamento funcional / operadoras / XML / auto-fill.
 */
export async function getTISSMappingRuntimeHealthSummary(
  port: TISSMappingRuntimePort,
): Promise<TISSMappingRuntimeHealthSummary> {
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
