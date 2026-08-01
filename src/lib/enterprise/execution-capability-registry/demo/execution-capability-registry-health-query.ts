/**
 * PoC Application — depende apenas de ExecutionCapabilityRegistryPort (EPC-24 Sprint 08).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionCapabilityRegistryPort } from "../ports/execution-capability-registry-port";
import type {
  ExecutionCapabilityRegistryPortCapabilities,
  ExecutionCapabilityRegistryPortHealth,
} from "../ports/types";

export type ExecutionCapabilityRegistryHealthSummary = {
  health: ExecutionCapabilityRegistryPortHealth;
  capabilities: ExecutionCapabilityRegistryPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionCapabilityRegistryHealthSummary(
  port: ExecutionCapabilityRegistryPort,
): Promise<ExecutionCapabilityRegistryHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
