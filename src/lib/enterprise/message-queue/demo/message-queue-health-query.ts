/**
 * PoC Application — depende apenas de ExecutionQueuePort (INF-01).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Workers.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionQueuePort } from "../ports/execution-queue-port";
import type { ExecutionQueuePortCapabilities, ExecutionQueuePortHealth } from "../ports/types";

export type MessageQueueHealthSummary = {
  health: ExecutionQueuePortHealth;
  capabilities: ExecutionQueuePortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getMessageQueueHealthSummary(
  port: ExecutionQueuePort,
): Promise<MessageQueueHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
