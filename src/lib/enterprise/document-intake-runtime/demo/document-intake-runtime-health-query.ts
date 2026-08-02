/**
 * PoC Application — depende apenas de DocumentIntakeRuntimePort (DIP-01).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { DocumentIntakeRuntimePort } from "../ports/document-intake-runtime-port";
import type {
  DocumentIntakeRuntimeCapabilities,
  DocumentIntakeRuntimeHealth,
} from "../ports/types";

export type DocumentIntakeRuntimeHealthSummary = {
  health: DocumentIntakeRuntimeHealth;
  capabilities: DocumentIntakeRuntimeCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 */
export async function getDocumentIntakeRuntimeHealthSummary(
  port: DocumentIntakeRuntimePort,
): Promise<DocumentIntakeRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
