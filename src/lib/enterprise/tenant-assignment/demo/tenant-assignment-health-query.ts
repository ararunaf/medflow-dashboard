/**
 * PoC Application — depende apenas de TenantAssignmentPort (EPC-10B).
 *
 * Não é usado por rotas, Server Functions, UI, Auth, RBAC ou produto.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { TenantAssignmentPort } from "../ports/tenant-assignment-port";
import type { TenantAssignmentCapabilities, TenantAssignmentHealth } from "../ports/types";

export type TenantAssignmentHealthSummary = {
  health: TenantAssignmentHealth;
  capabilities: TenantAssignmentCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, usuários ou domínio clínico.
 */
export async function getTenantAssignmentHealthSummary(
  port: TenantAssignmentPort,
): Promise<TenantAssignmentHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
