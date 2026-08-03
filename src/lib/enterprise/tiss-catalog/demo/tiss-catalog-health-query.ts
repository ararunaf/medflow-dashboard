/**
 * PoC Application — depende apenas de TISSCatalogPort (TISS-02).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { TISSCatalogPort } from "../ports/tiss-catalog-port";
import type {
  TISSCatalogHealth,
  TISSCatalogInfo,
  TISSCatalogPortCapabilities,
} from "../ports/types";

export type TISSCatalogHealthSummary = {
  health: TISSCatalogHealth;
  capabilities: TISSCatalogPortCapabilities;
  info: TISSCatalogInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de XML / operadoras / ANS / Storage / OCR.
 */
export async function getTISSCatalogHealthSummary(
  port: TISSCatalogPort,
): Promise<TISSCatalogHealthSummary> {
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
