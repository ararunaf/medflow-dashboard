/**
 * PoC Application — depende apenas de ExecutionEnvironmentRegistryPort (EPC-24 Sprint 14).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Environment Selection.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ExecutionEnvironmentRegistryPort } from "../ports/execution-environment-registry-port";
import type {
  ExecutionEnvironmentRegistryPortCapabilities,
  ExecutionEnvironmentRegistryPortHealth,
} from "../ports/types";

export type ExecutionEnvironmentRegistryHealthSummary = {
  health: ExecutionEnvironmentRegistryPortHealth;
  capabilities: ExecutionEnvironmentRegistryPortCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getExecutionEnvironmentRegistryHealthSummary(
  port: ExecutionEnvironmentRegistryPort,
): Promise<ExecutionEnvironmentRegistryHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
