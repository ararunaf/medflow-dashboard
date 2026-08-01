/**
 * PoC Application — depende apenas de AIAuditorPort (EPC-18).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store → Orchestrator.
 */
import type { AIAuditorPort } from "../ports/ai-auditor-port";
import type { AIAuditorCapabilities, AIAuditorHealth, AIAuditorProviderInfo } from "../ports/types";

export type AIAuditorHealthSummary = {
  health: AIAuditorHealth;
  capabilities: AIAuditorCapabilities;
  providerInfo: AIAuditorProviderInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, vendors de IA ou domínio clínico.
 */
export async function getAIAuditorHealthSummary(
  port: AIAuditorPort,
): Promise<AIAuditorHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  const providerInfo = port.providerInfo();
  return {
    health,
    capabilities,
    providerInfo,
    architectureLayer: "application",
  };
}
