/**
 * PoC Application — depende apenas de WorkflowRuntimePort (C-10).
 *
 * Não é usado por rotas, Server Functions, UI, SOAP, XML parser,
 * operadoras, banco, filas ou BPM.
 */
import type { WorkflowRuntimePort } from "../ports/workflow-runtime-port";
import type {
  WorkflowRuntimeCapabilities,
  WorkflowRuntimeHealth,
  WorkflowRuntimeInfo,
} from "../ports/types";

export type WorkflowRuntimeHealthSummary = {
  health: WorkflowRuntimeHealth;
  capabilities: WorkflowRuntimeCapabilities;
  info: WorkflowRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de workflow funcional / BPM / decisão automática.
 */
export async function getWorkflowRuntimeHealthSummary(
  port: WorkflowRuntimePort,
): Promise<WorkflowRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  const info = port.providerInfo();
  return {
    health,
    capabilities,
    info,
    architectureLayer: "application",
  };
}
