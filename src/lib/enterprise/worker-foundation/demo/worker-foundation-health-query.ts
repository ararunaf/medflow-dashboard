/**
 * PoC Application — depende apenas de ExecutionWorkerPort (INF-02).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Workers reais.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionWorkerPort } from "../ports/execution-worker-port";
import type { ExecutionWorkerPortCapabilities, ExecutionWorkerPortHealth } from "../ports/types";

export type WorkerFoundationHealthSummary = {
  health: ExecutionWorkerPortHealth;
  capabilities: ExecutionWorkerPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getWorkerFoundationHealthSummary(
  port: ExecutionWorkerPort,
): Promise<WorkerFoundationHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
