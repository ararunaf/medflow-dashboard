/**
 * PoC Application — depende apenas de ExecutionTracePort (EPC-24 Sprint 07).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionTracePort } from "../ports/execution-trace-port";
import type { ExecutionTracePortCapabilities, ExecutionTracePortHealth } from "../ports/types";

export type ExecutionTraceHealthSummary = {
  health: ExecutionTracePortHealth;
  capabilities: ExecutionTracePortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA, logs ou domínio clínico.
 */
export async function getExecutionTraceHealthSummary(
  port: ExecutionTracePort,
): Promise<ExecutionTraceHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
