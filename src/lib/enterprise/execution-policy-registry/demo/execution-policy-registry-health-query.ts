/**
 * PoC Application — depende apenas de ExecutionPolicyRegistryPort (EPC-24 Sprint 10).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionPolicyRegistryPort } from "../ports/execution-policy-registry-port";
import type {
  ExecutionPolicyRegistryPortCapabilities,
  ExecutionPolicyRegistryPortHealth,
} from "../ports/types";

export type ExecutionPolicyRegistryHealthSummary = {
  health: ExecutionPolicyRegistryPortHealth;
  capabilities: ExecutionPolicyRegistryPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionPolicyRegistryHealthSummary(
  port: ExecutionPolicyRegistryPort,
): Promise<ExecutionPolicyRegistryHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
