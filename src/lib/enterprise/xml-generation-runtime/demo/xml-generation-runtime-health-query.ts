/**
 * PoC Application — depende apenas de XMLGenerationRuntimePort (TISS-05).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { XMLGenerationRuntimePort } from "../ports/xml-generation-runtime-port";
import type {
  XMLGenerationRuntimeHealth,
  XMLGenerationRuntimeInfo,
  XMLGenerationRuntimePortCapabilities,
} from "../ports/types";

export type XMLGenerationRuntimeHealthSummary = {
  health: XMLGenerationRuntimeHealth;
  capabilities: XMLGenerationRuntimePortCapabilities;
  info: XMLGenerationRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de XML real / operadoras / contratos / tenants.
 */
export async function getXMLGenerationRuntimeHealthSummary(
  port: XMLGenerationRuntimePort,
): Promise<XMLGenerationRuntimeHealthSummary> {
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
