/**
 * PoC Application — depende apenas de OperatorRuntimePort (C-04).
 *
 * Não é usado por rotas, Server Functions, UI, operadoras reais,
 * autenticação, SOAP, XML, REST ou banco.
 */
import type { OperatorRuntimePort } from "../ports/operator-runtime-port";
import type {
  OperatorRuntimeCapabilities,
  OperatorRuntimeHealth,
  OperatorRuntimeInfo,
} from "../ports/types";

export type OperatorRuntimeHealthSummary = {
  health: OperatorRuntimeHealth;
  capabilities: OperatorRuntimeCapabilities;
  info: OperatorRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de operadoras reais.
 */
export async function getOperatorRuntimeHealthSummary(
  port: OperatorRuntimePort,
): Promise<OperatorRuntimeHealthSummary> {
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
