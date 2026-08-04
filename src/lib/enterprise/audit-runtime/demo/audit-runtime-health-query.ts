/**
 * PoC Application — depende apenas de AuditRuntimePort (F3-CAP-10).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA,
 * auditoria real, regras TISS ou correção automática.
 */
import type { AuditRuntimePort } from "../ports/audit-runtime-port";
import type {
  AuditRuntimeCapabilities,
  AuditRuntimeHealth,
  AuditRuntimeInfo,
} from "../ports/types";

export type AuditRuntimeHealthSummary = {
  health: AuditRuntimeHealth;
  capabilities: AuditRuntimeCapabilities;
  info: AuditRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de auditoria real / IA / regras TISS / correção automática.
 */
export async function getAuditRuntimeHealthSummary(
  port: AuditRuntimePort,
): Promise<AuditRuntimeHealthSummary> {
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
