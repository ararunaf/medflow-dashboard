/**
 * PoC Application — depende apenas de ExecutionConstraintRegistryPort (EPC-24 Sprint 11).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionConstraintRegistryPort } from "../ports/execution-constraint-registry-port";
import type {
  ExecutionConstraintRegistryPortCapabilities,
  ExecutionConstraintRegistryPortHealth,
} from "../ports/types";

export type ExecutionConstraintRegistryHealthSummary = {
  health: ExecutionConstraintRegistryPortHealth;
  capabilities: ExecutionConstraintRegistryPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionConstraintRegistryHealthSummary(
  port: ExecutionConstraintRegistryPort,
): Promise<ExecutionConstraintRegistryHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
