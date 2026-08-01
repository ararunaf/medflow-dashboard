/**
 * PoC Application — depende apenas de PersistencePort (EPC-01).
 *
 * Não é usado por rotas, Server Functions, UI ou APIs existentes.
 * Serve exclusivamente para provar Application → Port → Adapter.
 */
import type { PersistencePort } from "../ports/persistence-port";
import type { PersistenceCapabilities, PersistenceHealth } from "../ports/types";

export type PersistenceHealthSummary = {
  health: PersistenceHealth;
  capabilities: PersistenceCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de Supabase.
 */
export async function getPersistenceHealthSummary(
  port: PersistencePort,
): Promise<PersistenceHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
