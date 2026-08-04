/**
 * PoC Application — depende apenas de DocumentClassificationRuntimePort (F3-CAP-06 + DIP-04/CLASS-01 preservado).
 *
 * Não é usado por rotas, Server Functions, UI, OCR real, IA, ML ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type {
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeHealth,
  DocumentClassificationRuntimeInfo,
} from "../ports/types";

export type DocumentClassificationRuntimeHealthSummary = {
  health: DocumentClassificationRuntimeHealth;
  capabilities: DocumentClassificationRuntimeCapabilities;
  info: DocumentClassificationRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de classificação real / IA / ML / LLM.
 */
export async function getDocumentClassificationRuntimeHealthSummary(
  port: DocumentClassificationRuntimePort,
): Promise<DocumentClassificationRuntimeHealthSummary> {
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
