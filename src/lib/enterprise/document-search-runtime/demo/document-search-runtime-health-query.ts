/**
 * PoC Application — depende apenas de DocumentSearchRuntimePort (DIP-06).
 *
 * Não é usado por rotas, Server Functions, UI, busca real, indexação ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { DocumentSearchRuntimePort } from "../ports/document-search-runtime-port";
import type {
  DocumentSearchRuntimeCapabilities,
  DocumentSearchRuntimeHealth,
} from "../ports/types";

export type DocumentSearchRuntimeHealthSummary = {
  health: DocumentSearchRuntimeHealth;
  capabilities: DocumentSearchRuntimeCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 */
export async function getDocumentSearchRuntimeHealthSummary(
  port: DocumentSearchRuntimePort,
): Promise<DocumentSearchRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
