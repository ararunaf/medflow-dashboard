/**
 * PoC Application — depende apenas de AIOrchestrationRuntimePort (F3-CAP-09).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA real,
 * LLM, agentes, workflow ou decisão automática.
 */
import type { AIOrchestrationRuntimePort } from "../ports/ai-orchestration-runtime-port";
import type {
  AIOrchestrationRuntimeCapabilities,
  AIOrchestrationRuntimeHealth,
  AIOrchestrationRuntimeInfo,
} from "../ports/types";

export type AIOrchestrationRuntimeHealthSummary = {
  health: AIOrchestrationRuntimeHealth;
  capabilities: AIOrchestrationRuntimeCapabilities;
  info: AIOrchestrationRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de IA real / LLM / agentes / HTTP / prompts.
 */
export async function getAIOrchestrationRuntimeHealthSummary(
  port: AIOrchestrationRuntimePort,
): Promise<AIOrchestrationRuntimeHealthSummary> {
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
