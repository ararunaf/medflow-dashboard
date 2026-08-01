/**
 * PoC Application — depende apenas de OCRProviderPort (EPC-15).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 * Serve exclusivamente para provar Application → Port → Adapter.
 */
import type { OCRProviderPort } from "../ports/ocr-provider-port";
import type {
  OCRProviderHealth,
  OCRProviderInfo,
  OCRProviderPortCapabilities,
} from "../ports/types";

export type OCRProviderHealthSummary = {
  health: OCRProviderHealth;
  capabilities: OCRProviderPortCapabilities;
  info: OCRProviderInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de Azure / Google / Tesseract / OpenAI.
 */
export async function getOCRProviderHealthSummary(
  port: OCRProviderPort,
): Promise<OCRProviderHealthSummary> {
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
