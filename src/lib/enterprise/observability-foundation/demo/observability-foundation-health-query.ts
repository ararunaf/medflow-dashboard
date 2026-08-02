/**
 * PoC Application — depende apenas de ExecutionObservabilityPort (INF-04).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Observability real.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionObservabilityPort } from "../ports/execution-observability-port";
import type {
  ExecutionObservabilityPortCapabilities,
  ExecutionObservabilityPortHealth,
} from "../ports/types";

export type ObservabilityFoundationHealthSummary = {
  health: ExecutionObservabilityPortHealth;
  capabilities: ExecutionObservabilityPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getObservabilityFoundationHealthSummary(
  port: ExecutionObservabilityPort,
): Promise<ObservabilityFoundationHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
