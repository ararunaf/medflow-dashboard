/**
 * PoC Application — depende apenas de XMLRuntimePort (TISS-04).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { XMLRuntimePort } from "../ports/xml-runtime-port";
import type { XMLRuntimeHealth, XMLRuntimeInfo, XMLRuntimePortCapabilities } from "../ports/types";

export type XMLRuntimeHealthSummary = {
  health: XMLRuntimeHealth;
  capabilities: XMLRuntimePortCapabilities;
  info: XMLRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de XML real / operadoras / contratos / tenants.
 */
export async function getXMLRuntimeHealthSummary(
  port: XMLRuntimePort,
): Promise<XMLRuntimeHealthSummary> {
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
