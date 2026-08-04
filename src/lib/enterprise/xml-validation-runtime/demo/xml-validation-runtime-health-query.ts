/**
 * PoC Application — depende apenas de XMLValidationRuntimePort (C-02).
 *
 * Não é usado por rotas, Server Functions, UI, validação XML,
 * XSD, parser, correção automática ou SOAP.
 */
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type {
  XMLValidationRuntimeCapabilities,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
} from "../ports/types";

export type XMLValidationRuntimeHealthSummary = {
  health: XMLValidationRuntimeHealth;
  capabilities: XMLValidationRuntimeCapabilities;
  info: XMLValidationRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de validação XML / XSD / parser / correção.
 */
export async function getXMLValidationRuntimeHealthSummary(
  port: XMLValidationRuntimePort,
): Promise<XMLValidationRuntimeHealthSummary> {
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
