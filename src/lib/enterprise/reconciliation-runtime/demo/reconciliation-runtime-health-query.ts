/**
 * PoC Application — depende apenas de ReconciliationRuntimePort (C-09).
 *
 * Não é usado por rotas, Server Functions, UI, SOAP, XML parser,
 * operadoras, banco, filas ou workflow.
 */
import type { ReconciliationRuntimePort } from "../ports/reconciliation-runtime-port";
import type {
  ReconciliationRuntimeCapabilities,
  ReconciliationRuntimeHealth,
  ReconciliationRuntimeInfo,
} from "../ports/types";

export type ReconciliationRuntimeHealthSummary = {
  health: ReconciliationRuntimeHealth;
  capabilities: ReconciliationRuntimeCapabilities;
  info: ReconciliationRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de reconciliação funcional / matching automático.
 */
export async function getReconciliationRuntimeHealthSummary(
  port: ReconciliationRuntimePort,
): Promise<ReconciliationRuntimeHealthSummary> {
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
