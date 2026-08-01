/**
 * PoC Application — depende apenas de TenantPort (EPC-10A).
 *
 * Não é usado por rotas, Server Functions, UI, Auth, RBAC ou produto.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { TenantPort } from "../ports/tenant-port";
import type { TenantCapabilities, TenantHealth } from "../ports/types";

export type TenantHealthSummary = {
  health: TenantHealth;
  capabilities: TenantCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, usuários ou domínio clínico.
 */
export async function getTenantHealthSummary(port: TenantPort): Promise<TenantHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
