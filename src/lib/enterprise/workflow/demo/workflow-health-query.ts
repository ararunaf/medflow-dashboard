/**
 * PoC Application — depende apenas de WorkflowPort (EPC-05).
 *
 * Não é usado por rotas, Server Functions, UI, Settings, OCR, IA,
 * Rule Engine, Metadata ou Persistence de produto.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { WorkflowPort } from "../ports/workflow-port";
import type { WorkflowCapabilities, WorkflowHealth } from "../ports/types";

export type WorkflowHealthSummary = {
  health: WorkflowHealth;
  capabilities: WorkflowCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico ou domínio clínico.
 */
export async function getWorkflowHealthSummary(port: WorkflowPort): Promise<WorkflowHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
