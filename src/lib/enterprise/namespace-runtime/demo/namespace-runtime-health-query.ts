/**
 * PoC Application — depende apenas de NamespaceRuntimePort (TISS-10).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { NamespaceRuntimePort } from "../ports/namespace-runtime-port";
import type {
  NamespaceRuntimeHealth,
  NamespaceRuntimeInfo,
  NamespaceRuntimePortCapabilities,
} from "../ports/types";

export type NamespaceRuntimeHealthSummary = {
  health: NamespaceRuntimeHealth;
  capabilities: NamespaceRuntimePortCapabilities;
  info: NamespaceRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de namespace oficial / resolução real / XML TISS/ANS / operadoras.
 */
export async function getNamespaceRuntimeHealthSummary(
  port: NamespaceRuntimePort,
): Promise<NamespaceRuntimeHealthSummary> {
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
