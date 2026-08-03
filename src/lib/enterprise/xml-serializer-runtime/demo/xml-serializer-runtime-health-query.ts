/**
 * PoC Application — depende apenas de XMLSerializerRuntimePort (TISS-06).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { XMLSerializerRuntimePort } from "../ports/xml-serializer-runtime-port";
import type {
  XMLSerializerRuntimeHealth,
  XMLSerializerRuntimeInfo,
  XMLSerializerRuntimePortCapabilities,
} from "../ports/types";

export type XMLSerializerRuntimeHealthSummary = {
  health: XMLSerializerRuntimeHealth;
  capabilities: XMLSerializerRuntimePortCapabilities;
  info: XMLSerializerRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de XML TISS/ANS / operadoras / contratos / tenants.
 */
export async function getXMLSerializerRuntimeHealthSummary(
  port: XMLSerializerRuntimePort,
): Promise<XMLSerializerRuntimeHealthSummary> {
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
