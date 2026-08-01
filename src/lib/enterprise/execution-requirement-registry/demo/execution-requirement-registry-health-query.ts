/**
 * PoC Application — depende apenas de ExecutionRequirementRegistryPort (EPC-24 Sprint 12).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionRequirementRegistryPort } from "../ports/execution-requirement-registry-port";
import type {
  ExecutionRequirementRegistryPortCapabilities,
  ExecutionRequirementRegistryPortHealth,
} from "../ports/types";

export type ExecutionRequirementRegistryHealthSummary = {
  health: ExecutionRequirementRegistryPortHealth;
  capabilities: ExecutionRequirementRegistryPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionRequirementRegistryHealthSummary(
  port: ExecutionRequirementRegistryPort,
): Promise<ExecutionRequirementRegistryHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
