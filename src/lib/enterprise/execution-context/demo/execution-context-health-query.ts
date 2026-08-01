/**
 * PoC Application — depende apenas de ExecutionContextPort (EPC-24 Sprint 03).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionContextPort } from "../ports/execution-context-port";
import type { ExecutionContextCapabilities, ExecutionContextHealth } from "../ports/types";

export type ExecutionContextHealthSummary = {
  health: ExecutionContextHealth;
  capabilities: ExecutionContextCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionContextHealthSummary(
  port: ExecutionContextPort,
): Promise<ExecutionContextHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
