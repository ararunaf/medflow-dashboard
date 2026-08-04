/**
 * PoC Application — depende apenas de QualityRuntimePort (F3-CAP-13).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA,
 * avaliação automática funcional, score ou decisão automática.
 */
import type { QualityRuntimePort } from "../ports/quality-runtime-port";
import type {
  QualityRuntimeCapabilities,
  QualityRuntimeHealth,
  QualityRuntimeInfo,
} from "../ports/types";

export type QualityRuntimeHealthSummary = {
  health: QualityRuntimeHealth;
  capabilities: QualityRuntimeCapabilities;
  info: QualityRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de avaliação automática / score / decisão / IA.
 */
export async function getQualityRuntimeHealthSummary(
  port: QualityRuntimePort,
): Promise<QualityRuntimeHealthSummary> {
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
