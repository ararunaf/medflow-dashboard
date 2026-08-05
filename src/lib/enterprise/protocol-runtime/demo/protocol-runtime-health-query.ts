/**
 * PoC Application — depende apenas de ProtocolRuntimePort (C-07).
 *
 * Não é usado por rotas, Server Functions, UI, SOAP, REST, gRPC,
 * mensageria, HTTP, TLS, operadoras ou banco.
 */
import type { ProtocolRuntimePort } from "../ports/protocol-runtime-port";
import type {
  ProtocolRuntimeCapabilities,
  ProtocolRuntimeHealth,
  ProtocolRuntimeInfo,
} from "../ports/types";

export type ProtocolRuntimeHealthSummary = {
  health: ProtocolRuntimeHealth;
  capabilities: ProtocolRuntimeCapabilities;
  info: ProtocolRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de protocolos concretos / resolução funcional.
 */
export async function getProtocolRuntimeHealthSummary(
  port: ProtocolRuntimePort,
): Promise<ProtocolRuntimeHealthSummary> {
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
