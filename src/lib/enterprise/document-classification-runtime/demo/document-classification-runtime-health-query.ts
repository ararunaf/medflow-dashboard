/**
 * PoC Application — depende apenas de DocumentClassificationRuntimePort (DIP-04).
 *
 * Não é usado por rotas, Server Functions, UI, OCR real, IA, ML ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type {
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeHealth,
} from "../ports/types";

export type DocumentClassificationRuntimeHealthSummary = {
  health: DocumentClassificationRuntimeHealth;
  capabilities: DocumentClassificationRuntimeCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 */
export async function getDocumentClassificationRuntimeHealthSummary(
  port: DocumentClassificationRuntimePort,
): Promise<DocumentClassificationRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
