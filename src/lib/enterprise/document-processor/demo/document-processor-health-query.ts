/**
 * PoC Application — depende apenas de DocumentProcessorPort (EPC-13).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { DocumentProcessorPort } from "../ports/document-processor-port";
import type { DocumentProcessorCapabilities, DocumentProcessorHealth } from "../ports/types";

export type DocumentProcessorHealthSummary = {
  health: DocumentProcessorHealth;
  capabilities: DocumentProcessorCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getDocumentProcessorHealthSummary(
  port: DocumentProcessorPort,
): Promise<DocumentProcessorHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
