/**
 * PoC Application — depende apenas de AIOrchestratorPort (EPC-16).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store → EPC-07.
 */
import type { AIOrchestratorPort } from "../ports/ai-orchestrator-port";
import type { AIOrchestratorCapabilities, AIOrchestratorHealth } from "../ports/types";

export type AIOrchestratorHealthSummary = {
  health: AIOrchestratorHealth;
  capabilities: AIOrchestratorCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, vendors de IA ou domínio clínico.
 */
export async function getAIOrchestratorHealthSummary(
  port: AIOrchestratorPort,
): Promise<AIOrchestratorHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
