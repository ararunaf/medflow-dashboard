/**
 * PoC Application — depende apenas de SearchProviderPort (SEARCH-01).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { SearchProviderPort } from "../ports/search-provider-port";
import type {
  SearchProviderHealth,
  SearchProviderInfo,
  SearchProviderPortCapabilities,
} from "../ports/types";

export type SearchProviderHealthSummary = {
  health: SearchProviderHealth;
  capabilities: SearchProviderPortCapabilities;
  info: SearchProviderInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de Elastic / OpenSearch / Azure Search / Supabase direto.
 */
export async function getSearchProviderHealthSummary(
  port: SearchProviderPort,
): Promise<SearchProviderHealthSummary> {
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
