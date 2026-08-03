/**
 * PoC Application — depende apenas de RulePackEnginePort (TISS-03).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { RulePackEnginePort } from "../ports/rule-pack-engine-port";
import type {
  RulePackEngineHealth,
  RulePackEngineInfo,
  RulePackEnginePortCapabilities,
} from "../ports/types";

export type RulePackEngineHealthSummary = {
  health: RulePackEngineHealth;
  capabilities: RulePackEnginePortCapabilities;
  info: RulePackEngineInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de XML / operadoras / contratos / tenants.
 */
export async function getRulePackEngineHealthSummary(
  port: RulePackEnginePort,
): Promise<RulePackEngineHealthSummary> {
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
