/**
 * PoC Application — depende apenas de ExecutionDependencyRegistryPort (EPC-24 Sprint 09).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionDependencyRegistryPort } from "../ports/execution-dependency-registry-port";
import type {
  ExecutionDependencyRegistryPortCapabilities,
  ExecutionDependencyRegistryPortHealth,
} from "../ports/types";

export type ExecutionDependencyRegistryHealthSummary = {
  health: ExecutionDependencyRegistryPortHealth;
  capabilities: ExecutionDependencyRegistryPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionDependencyRegistryHealthSummary(
  port: ExecutionDependencyRegistryPort,
): Promise<ExecutionDependencyRegistryHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
