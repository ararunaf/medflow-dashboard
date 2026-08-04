/**
 * PoC Application — depende apenas de SOAPRuntimePort (C-03).
 *
 * Não é usado por rotas, Server Functions, UI, comunicação SOAP,
 * HTTP, WSDL, TLS, certificado ou autenticação.
 */
import type { SOAPRuntimePort } from "../ports/soap-runtime-port";
import type { SOAPRuntimeCapabilities, SOAPRuntimeHealth, SOAPRuntimeInfo } from "../ports/types";

export type SOAPRuntimeHealthSummary = {
  health: SOAPRuntimeHealth;
  capabilities: SOAPRuntimeCapabilities;
  info: SOAPRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de comunicação SOAP / HTTP / WSDL / TLS.
 */
export async function getSOAPRuntimeHealthSummary(
  port: SOAPRuntimePort,
): Promise<SOAPRuntimeHealthSummary> {
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
