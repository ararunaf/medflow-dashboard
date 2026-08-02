/**
 * PoC Application — depende apenas de OCRRuntimePort (DIP-03).
 *
 * Não é usado por rotas, Server Functions, UI, OCR real, IA ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type { OCRRuntimeCapabilities, OCRRuntimeHealth } from "../ports/types";

export type OCRRuntimeHealthSummary = {
  health: OCRRuntimeHealth;
  capabilities: OCRRuntimeCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 */
export async function getOCRRuntimeHealthSummary(
  port: OCRRuntimePort,
): Promise<OCRRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
