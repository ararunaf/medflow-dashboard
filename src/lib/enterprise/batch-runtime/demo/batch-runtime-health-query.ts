/**
 * PoC Application — depende apenas de BatchRuntimePort (C-06).
 *
 * Não é usado por rotas, Server Functions, UI, processamento em lote,
 * filas, workers, SOAP, XML, operadoras ou banco.
 */
import type { BatchRuntimePort } from "../ports/batch-runtime-port";
import type {
  BatchRuntimeCapabilities,
  BatchRuntimeHealth,
  BatchRuntimeInfo,
} from "../ports/types";

export type BatchRuntimeHealthSummary = {
  health: BatchRuntimeHealth;
  capabilities: BatchRuntimeCapabilities;
  info: BatchRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de processamento em lote / filas / workers.
 */
export async function getBatchRuntimeHealthSummary(
  port: BatchRuntimePort,
): Promise<BatchRuntimeHealthSummary> {
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
