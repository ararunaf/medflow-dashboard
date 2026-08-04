/**
 * PoC Application — depende apenas de IntelligentCaptureRuntimePort (F3-CAP-04).
 *
 * Não é usado por rotas, Server Functions, UI, upload, Scanner físico,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { IntelligentCaptureRuntimePort } from "../ports/intelligent-capture-runtime-port";
import type {
  IntelligentCaptureRuntimeHealth,
  IntelligentCaptureRuntimeInfo,
  IntelligentCaptureRuntimePortCapabilities,
} from "../ports/types";

export type IntelligentCaptureRuntimeHealthSummary = {
  health: IntelligentCaptureRuntimeHealth;
  capabilities: IntelligentCaptureRuntimePortCapabilities;
  info: IntelligentCaptureRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de OCR / IA / Pipeline / captura automática / leitura de arquivos.
 */
export async function getIntelligentCaptureRuntimeHealthSummary(
  port: IntelligentCaptureRuntimePort,
): Promise<IntelligentCaptureRuntimeHealthSummary> {
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
