/**
 * PoC Application — depende apenas de RulePort (EPC-06A).
 *
 * Não é usado por rotas, Server Functions, UI, Settings, OCR, IA,
 * Workflow, Metadata ou Persistence de produto.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { RulePort } from "../ports/rule-port";
import type { RuleCapabilities, RuleHealth } from "../ports/types";

export type RuleHealthSummary = {
  health: RuleHealth;
  capabilities: RuleCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico ou domínio clínico.
 */
export async function getRuleHealthSummary(port: RulePort): Promise<RuleHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
