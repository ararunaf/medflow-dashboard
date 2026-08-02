/**
 * PoC Application — depende apenas de TISSProviderPort (TISS-01).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { TISSProviderPort } from "../ports/tiss-provider-port";
import type {
  TISSProviderHealth,
  TISSProviderInfo,
  TISSProviderPortCapabilities,
} from "../ports/types";

export type TISSProviderHealthSummary = {
  health: TISSProviderHealth;
  capabilities: TISSProviderPortCapabilities;
  info: TISSProviderInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de XML / operadoras / ANS / Storage / OCR.
 */
export async function getTISSProviderHealthSummary(
  port: TISSProviderPort,
): Promise<TISSProviderHealthSummary> {
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
