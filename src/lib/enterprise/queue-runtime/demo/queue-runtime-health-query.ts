/**
 * PoC Application — depende apenas de QueueRuntimePort (INF-05).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type {
  QueueRuntimeHealth,
  QueueRuntimeInfo,
  QueueRuntimePortCapabilities,
} from "../ports/types";

export type QueueRuntimeHealthSummary = {
  health: QueueRuntimeHealth;
  capabilities: QueueRuntimePortCapabilities;
  info: QueueRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de filas reais / workers / backends / operadoras.
 */
export async function getQueueRuntimeHealthSummary(
  port: QueueRuntimePort,
): Promise<QueueRuntimeHealthSummary> {
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
