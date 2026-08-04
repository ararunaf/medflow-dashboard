/**
 * PoC Application — depende apenas de XMLTISSRuntimePort (C-01).
 *
 * Não é usado por rotas, Server Functions, UI, geração de XML,
 * serialização, parser, XSD ou SOAP.
 */
import type { XMLTISSRuntimePort } from "../ports/xml-tiss-runtime-port";
import type {
  XMLTISSRuntimeCapabilities,
  XMLTISSRuntimeHealth,
  XMLTISSRuntimeInfo,
} from "../ports/types";

export type XMLTISSRuntimeHealthSummary = {
  health: XMLTISSRuntimeHealth;
  capabilities: XMLTISSRuntimeCapabilities;
  info: XMLTISSRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de geração / serialização / parser / XSD / SOAP.
 */
export async function getXMLTISSRuntimeHealthSummary(
  port: XMLTISSRuntimePort,
): Promise<XMLTISSRuntimeHealthSummary> {
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
