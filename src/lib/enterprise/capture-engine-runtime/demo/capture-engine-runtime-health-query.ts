/**
 * PoC Application — depende apenas de CaptureEngineRuntimePort (DIP-02).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA ou Workflow.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { CaptureEngineRuntimePort } from "../ports/capture-engine-runtime-port";
import type { CaptureEngineRuntimeCapabilities, CaptureEngineRuntimeHealth } from "../ports/types";

export type CaptureEngineRuntimeHealthSummary = {
  health: CaptureEngineRuntimeHealth;
  capabilities: CaptureEngineRuntimeCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 */
export async function getCaptureEngineRuntimeHealthSummary(
  port: CaptureEngineRuntimePort,
): Promise<CaptureEngineRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
