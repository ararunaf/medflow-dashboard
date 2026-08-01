/**
 * PoC Application — depende apenas de DocumentIdentityPort (EPC-08).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, Storage, Workflow ou IA.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { DocumentIdentityPort } from "../ports/document-identity-port";
import type { DocumentIdentityCapabilities, DocumentIdentityHealth } from "../ports/types";

export type DocumentIdentityHealthSummary = {
  health: DocumentIdentityHealth;
  capabilities: DocumentIdentityCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico ou domínio clínico.
 */
export async function getDocumentIdentityHealthSummary(
  port: DocumentIdentityPort,
): Promise<DocumentIdentityHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
