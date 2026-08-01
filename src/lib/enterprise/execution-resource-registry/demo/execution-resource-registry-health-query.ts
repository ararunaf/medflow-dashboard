/**
 * PoC Application — depende apenas de ExecutionResourceRegistryPort (EPC-24 Sprint 13).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Resource Allocation.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionResourceRegistryPort } from "../ports/execution-resource-registry-port";
import type {
  ExecutionResourceRegistryPortCapabilities,
  ExecutionResourceRegistryPortHealth,
} from "../ports/types";

export type ExecutionResourceRegistryHealthSummary = {
  health: ExecutionResourceRegistryPortHealth;
  capabilities: ExecutionResourceRegistryPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionResourceRegistryHealthSummary(
  port: ExecutionResourceRegistryPort,
): Promise<ExecutionResourceRegistryHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
