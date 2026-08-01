/**
 * PoC Application — depende apenas de ContractPort (EPC-11).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ContractPort } from "../ports/contract-port";
import type { ContractCapabilities, ContractHealth } from "../ports/types";

export type ContractHealthSummary = {
  health: ContractHealth;
  capabilities: ContractCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, TISS ou domínio clínico.
 */
export async function getContractHealthSummary(port: ContractPort): Promise<ContractHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
