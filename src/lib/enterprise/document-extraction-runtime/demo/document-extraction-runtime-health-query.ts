/**
 * PoC Application — depende apenas de DocumentExtractionRuntimePort (F3-CAP-07).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, extração real,
 * Contratos, Rule Engine, Workflow ou preenchimento de guias.
 */
import type { DocumentExtractionRuntimePort } from "../ports/document-extraction-runtime-port";
import type {
  DocumentExtractionRuntimeCapabilities,
  DocumentExtractionRuntimeHealth,
  DocumentExtractionRuntimeInfo,
} from "../ports/types";

export type DocumentExtractionRuntimeHealthSummary = {
  health: DocumentExtractionRuntimeHealth;
  capabilities: DocumentExtractionRuntimeCapabilities;
  info: DocumentExtractionRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de extração real / OCR / IA / ML / LLM / Regex / Template Matching.
 */
export async function getDocumentExtractionRuntimeHealthSummary(
  port: DocumentExtractionRuntimePort,
): Promise<DocumentExtractionRuntimeHealthSummary> {
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
