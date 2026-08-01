/**
 * PoC Application — depende apenas de ExecutionRegistryPort (EPC-24 Sprint 06).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionRegistryPort } from "../ports/execution-registry-port";
import type {
  ExecutionRegistryPortCapabilities,
  ExecutionRegistryPortHealth,
} from "../ports/types";

export type ExecutionRegistryHealthSummary = {
  health: ExecutionRegistryPortHealth;
  capabilities: ExecutionRegistryPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionRegistryHealthSummary(
  port: ExecutionRegistryPort,
): Promise<ExecutionRegistryHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
