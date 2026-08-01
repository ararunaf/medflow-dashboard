/**
 * PoC Application — depende apenas de TISSRuleRuntimePort (EPC-23).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { TISSRuleRuntimePort } from "../ports/tiss-rule-runtime-port";
import type { TISSRuleRuntimeCapabilities, TISSRuleRuntimeHealth } from "../ports/types";

export type TISSRuleRuntimeHealthSummary = {
  health: TISSRuleRuntimeHealth;
  capabilities: TISSRuleRuntimeCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de regras, contratos, validação TISS ou OCR.
 */
export async function getTISSRuleRuntimeHealthSummary(
  port: TISSRuleRuntimePort,
): Promise<TISSRuleRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
