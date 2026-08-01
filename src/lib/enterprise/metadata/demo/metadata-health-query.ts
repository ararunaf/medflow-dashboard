/**
 * PoC Application — depende apenas de MetadataPort (EPC-04).
 *
 * Não é usado por rotas, Server Functions, UI, Settings, OCR, IA ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { MetadataPort } from "../ports/metadata-port";
import type { MetadataCapabilities, MetadataHealth } from "../ports/types";

export type MetadataHealthSummary = {
  health: MetadataHealth;
  capabilities: MetadataCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico ou domínio clínico.
 */
export async function getMetadataHealthSummary(port: MetadataPort): Promise<MetadataHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
