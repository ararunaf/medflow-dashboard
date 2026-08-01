/**
 * PoC Application — depende apenas de DocumentIntakePort (EPC-12).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Captura ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { DocumentIntakePort } from "../ports/document-intake-port";
import type { DocumentIntakeCapabilities, DocumentIntakeHealth } from "../ports/types";

export type DocumentIntakeHealthSummary = {
  health: DocumentIntakeHealth;
  capabilities: DocumentIntakeCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, TISS, OCR ou domínio clínico.
 */
export async function getDocumentIntakeHealthSummary(
  port: DocumentIntakePort,
): Promise<DocumentIntakeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
