/**
 * PoC Application — depende apenas de CanonicalExecutionOrchestratorPort (EPC-24).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { CanonicalExecutionOrchestratorPort } from "../ports/canonical-execution-orchestrator-port";
import type {
  CanonicalExecutionOrchestratorCapabilities,
  CanonicalExecutionOrchestratorHealth,
} from "../ports/types";

export type CanonicalExecutionOrchestratorHealthSummary = {
  health: CanonicalExecutionOrchestratorHealth;
  capabilities: CanonicalExecutionOrchestratorCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de OCR, IA, Mapping, regras TISS ou validações.
 */
export async function getCanonicalExecutionOrchestratorHealthSummary(
  port: CanonicalExecutionOrchestratorPort,
): Promise<CanonicalExecutionOrchestratorHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
