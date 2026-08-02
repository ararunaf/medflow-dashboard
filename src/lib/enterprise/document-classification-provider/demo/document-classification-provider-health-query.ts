/**
 * PoC Application — depende apenas de DocumentClassificationProviderPort (CLASS-01).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { DocumentClassificationProviderPort } from "../ports/document-classification-provider-port";
import type {
  DocumentClassificationProviderHealth,
  DocumentClassificationProviderInfo,
  DocumentClassificationProviderPortCapabilities,
} from "../ports/types";

export type DocumentClassificationProviderHealthSummary = {
  health: DocumentClassificationProviderHealth;
  capabilities: DocumentClassificationProviderPortCapabilities;
  info: DocumentClassificationProviderInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de OpenAI / Azure OpenAI / Gemini / Claude / ML.
 */
export async function getDocumentClassificationProviderHealthSummary(
  port: DocumentClassificationProviderPort,
): Promise<DocumentClassificationProviderHealthSummary> {
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
