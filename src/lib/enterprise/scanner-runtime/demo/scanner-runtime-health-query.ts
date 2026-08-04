/**
 * PoC Application — depende apenas de ScannerRuntimePort (F3-CAP-01).
 *
 * Não é usado por rotas, Server Functions, UI, Upload, Scanner físico,
 * Contratos, Rule Engine, Workflow ou IA.
 */
import type { ScannerRuntimePort } from "../ports/scanner-runtime-port";
import type {
  ScannerRuntimeHealth,
  ScannerRuntimeInfo,
  ScannerRuntimePortCapabilities,
} from "../ports/types";

export type ScannerRuntimeHealthSummary = {
  health: ScannerRuntimeHealth;
  capabilities: ScannerRuntimePortCapabilities;
  info: ScannerRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de Scanner real / TWAIN / WIA / ISIS / drivers.
 */
export async function getScannerRuntimeHealthSummary(
  port: ScannerRuntimePort,
): Promise<ScannerRuntimeHealthSummary> {
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
