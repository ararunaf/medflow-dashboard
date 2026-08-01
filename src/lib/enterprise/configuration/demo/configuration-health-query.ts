/**
 * PoC Application — depende apenas de ConfigurationPort (EPC-03).
 *
 * Não é usado por rotas, Server Functions, UI, Settings, Auth ou Feature Flags.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { ConfigurationPort } from "../ports/configuration-port";
import type { ConfigurationCapabilities, ConfigurationHealth } from "../ports/types";

export type ConfigurationHealthSummary = {
  health: ConfigurationHealth;
  capabilities: ConfigurationCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, env legado ou vendors.
 */
export async function getConfigurationHealthSummary(
  port: ConfigurationPort,
): Promise<ConfigurationHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
