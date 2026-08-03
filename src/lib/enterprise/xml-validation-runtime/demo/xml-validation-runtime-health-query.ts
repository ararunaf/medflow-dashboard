/**
 * PoC Application — depende apenas de XMLValidationRuntimePort (TISS-08).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type {
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimePortCapabilities,
} from "../ports/types";

export type XMLValidationRuntimeHealthSummary = {
  health: XMLValidationRuntimeHealth;
  capabilities: XMLValidationRuntimePortCapabilities;
  info: XMLValidationRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de XSD oficial / validação real / XML TISS/ANS / operadoras.
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
