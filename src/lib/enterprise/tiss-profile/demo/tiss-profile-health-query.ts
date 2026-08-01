/**
 * PoC Application — depende apenas de TISSProfilePort (EPC-22).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { TISSProfilePort } from "../ports/tiss-profile-port";
import type { TISSProfileCapabilities, TISSProfileHealth } from "../ports/types";

export type TISSProfileHealthSummary = {
  health: TISSProfileHealth;
  capabilities: TISSProfileCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de layout XML, parser, validação ou operadoras.
 */
export async function getTISSProfileHealthSummary(
  port: TISSProfilePort,
): Promise<TISSProfileHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
