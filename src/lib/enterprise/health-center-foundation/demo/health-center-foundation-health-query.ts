/**
 * PoC Application — depende apenas de ExecutionHealthCenterPort (INF-05).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Health real.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionHealthCenterPort } from "../ports/execution-health-center-port";
import type {
  ExecutionHealthCenterPortCapabilities,
  ExecutionHealthCenterPortHealth,
} from "../ports/types";

export type HealthCenterFoundationHealthSummary = {
  health: ExecutionHealthCenterPortHealth;
  capabilities: ExecutionHealthCenterPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 * NÃO executa health checks reais de componentes.
 */
export async function getHealthCenterFoundationHealthSummary(
  port: ExecutionHealthCenterPort,
): Promise<HealthCenterFoundationHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
