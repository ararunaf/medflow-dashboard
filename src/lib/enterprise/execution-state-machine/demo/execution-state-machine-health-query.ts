/**
 * PoC Application — depende apenas de ExecutionStateMachinePort (EPC-24 Sprint 04).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionStateMachinePort } from "../ports/execution-state-machine-port";
import type {
  ExecutionStateMachineHealth,
  ExecutionStateMachinePortCapabilities,
} from "../ports/types";

export type ExecutionStateMachineHealthSummary = {
  health: ExecutionStateMachineHealth;
  capabilities: ExecutionStateMachinePortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionStateMachineHealthSummary(
  port: ExecutionStateMachinePort,
): Promise<ExecutionStateMachineHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
