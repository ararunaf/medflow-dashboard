/**
 * PoC Application — depende apenas de ExecutionEventBusPort (EPC-24 Sprint 05).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionEventBusPort } from "../ports/execution-event-bus-port";
import type { ExecutionEventBusHealth, ExecutionEventBusPortCapabilities } from "../ports/types";

export type ExecutionEventBusHealthSummary = {
  health: ExecutionEventBusHealth;
  capabilities: ExecutionEventBusPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionEventBusHealthSummary(
  port: ExecutionEventBusPort,
): Promise<ExecutionEventBusHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
