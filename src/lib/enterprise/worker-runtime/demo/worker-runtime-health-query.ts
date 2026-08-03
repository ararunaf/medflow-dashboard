/**
 * PoC Application — depende apenas de WorkerRuntimePort (INF-06).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { WorkerRuntimePort } from "../ports/worker-runtime-port";
import type {
  WorkerRuntimeHealth,
  WorkerRuntimeInfo,
  WorkerRuntimePortCapabilities,
} from "../ports/types";

export type WorkerRuntimeHealthSummary = {
  health: WorkerRuntimeHealth;
  capabilities: WorkerRuntimePortCapabilities;
  info: WorkerRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de Workers reais / Scheduler / Thread Pool / operadoras.
 */
export async function getWorkerRuntimeHealthSummary(
  port: WorkerRuntimePort,
): Promise<WorkerRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  const info = port.providerInfo();
  return {
    health,
    capabilities,
    info,
    architectureLayer: "application",
  };
}
