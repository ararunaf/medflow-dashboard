/**
 * PoC Application — depende apenas de OCRRuntimePort (F3-CAP-05 + DIP-03 preservado).
 *
 * Não é usado por rotas, Server Functions, UI, OCR real, IA ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type { OCRRuntimeCapabilities, OCRRuntimeHealth, OCRRuntimeInfo } from "../ports/types";

export type OCRRuntimeHealthSummary = {
  health: OCRRuntimeHealth;
  capabilities: OCRRuntimeCapabilities;
  info: OCRRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de OCR real / IA / Tesseract / Azure / Google / AWS / ABBYY / PaddleOCR.
 */
export async function getOCRRuntimeHealthSummary(
  port: OCRRuntimePort,
): Promise<OCRRuntimeHealthSummary> {
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
