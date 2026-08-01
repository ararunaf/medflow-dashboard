/**
 * PoC Application — depende apenas de ProcessingProviderPort (EPC-14).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Registry.
 */
import type { ProcessingProviderPort } from "../ports/processing-provider-port";
import type { ProcessingProviderCapabilities, ProcessingProviderHealth } from "../ports/types";

export type ProcessingProviderHealthSummary = {
  health: ProcessingProviderHealth;
  capabilities: ProcessingProviderCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de registry físico, OCR, IA ou domínio clínico.
 */
export async function getProcessingProviderHealthSummary(
  port: ProcessingProviderPort,
): Promise<ProcessingProviderHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
