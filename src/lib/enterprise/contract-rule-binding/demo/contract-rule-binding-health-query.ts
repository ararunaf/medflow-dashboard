/**
 * PoC Application — depende apenas de ContractRuleBindingPort (EPC-17).
 *
 * Não é usado por rotas, Server Functions, UI, Auth, OCR, IA ou produto.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ContractRuleBindingPort } from "../ports/contract-rule-binding-port";
import type { ContractRuleBindingCapabilities, ContractRuleBindingHealth } from "../ports/types";

export type ContractRuleBindingHealthSummary = {
  health: ContractRuleBindingHealth;
  capabilities: ContractRuleBindingCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, Contratos, Rule Packs ou Rule Engine.
 */
export async function getContractRuleBindingHealthSummary(
  port: ContractRuleBindingPort,
): Promise<ContractRuleBindingHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
