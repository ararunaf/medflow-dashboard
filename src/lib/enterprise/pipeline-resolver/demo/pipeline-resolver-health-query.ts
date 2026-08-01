/**
 * PoC Application — depende apenas de PipelineResolverPort (EPC-24 Sprint 02).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { PipelineResolverPort } from "../ports/pipeline-resolver-port";
import type { PipelineCapabilities, PipelineResolverHealth } from "../ports/types";

export type PipelineResolverHealthSummary = {
  health: PipelineResolverHealth;
  capabilities: PipelineCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de store físico, OCR, IA ou domínio clínico.
 */
export async function getPipelineResolverHealthSummary(
  port: PipelineResolverPort,
): Promise<PipelineResolverHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
