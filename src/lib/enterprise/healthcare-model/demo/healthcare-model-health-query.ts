/**
 * PoC Application — depende apenas de HealthcareModelPort (EPC-19).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { HealthcareModelPort } from "../ports/healthcare-model-port";
import type { HealthcareModelCapabilities, HealthcareModelHealth } from "../ports/types";

export type HealthcareModelHealthSummary = {
  health: HealthcareModelHealth;
  capabilities: HealthcareModelCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, TISS, ANS ou operadoras.
 */
export async function getHealthcareModelHealthSummary(
  port: HealthcareModelPort,
): Promise<HealthcareModelHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
