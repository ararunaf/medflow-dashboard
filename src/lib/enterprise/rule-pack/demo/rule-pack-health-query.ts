/**
 * PoC Application — depende apenas de RulePackPort (EPC-09).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { RulePackPort } from "../ports/rule-pack-port";
import type { RulePackCapabilities, RulePackHealth } from "../ports/types";

export type RulePackHealthSummary = {
  health: RulePackHealth;
  capabilities: RulePackCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico ou domínio clínico.
 */
export async function getRulePackHealthSummary(port: RulePackPort): Promise<RulePackHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
