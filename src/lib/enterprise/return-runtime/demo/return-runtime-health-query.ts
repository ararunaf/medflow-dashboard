/**
 * PoC Application — depende apenas de ReturnRuntimePort (C-08).
 *
 * Não é usado por rotas, Server Functions, UI, SOAP, XML parser,
 * operadoras, banco, filas ou workflow.
 */
import type { ReturnRuntimePort } from "../ports/return-runtime-port";
import type {
  ReturnRuntimeCapabilities,
  ReturnRuntimeHealth,
  ReturnRuntimeInfo,
} from "../ports/types";

export type ReturnRuntimeHealthSummary = {
  health: ReturnRuntimeHealth;
  capabilities: ReturnRuntimeCapabilities;
  info: ReturnRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de processamento de retorno / correlação automática.
 */
export async function getReturnRuntimeHealthSummary(
  port: ReturnRuntimePort,
): Promise<ReturnRuntimeHealthSummary> {
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
