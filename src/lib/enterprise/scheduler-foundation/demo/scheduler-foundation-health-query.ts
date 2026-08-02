/**
 * PoC Application — depende apenas de ExecutionSchedulerPort (INF-03).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Schedulers reais.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionSchedulerPort } from "../ports/execution-scheduler-port";
import type {
  ExecutionSchedulerPortCapabilities,
  ExecutionSchedulerPortHealth,
} from "../ports/types";

export type SchedulerFoundationHealthSummary = {
  health: ExecutionSchedulerPortHealth;
  capabilities: ExecutionSchedulerPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getSchedulerFoundationHealthSummary(
  port: ExecutionSchedulerPort,
): Promise<SchedulerFoundationHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
