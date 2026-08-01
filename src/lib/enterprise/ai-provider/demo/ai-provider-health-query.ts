/**
 * PoC Application — depende apenas de AIProviderPort (EPC-07).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, Auditoria ou Captura.
 * Serve exclusivamente para provar Application → Port → Adapter.
 */
import type { AIProviderPort } from "../ports/ai-provider-port";
import type { AIProviderCapabilities, AIProviderHealth, AIProviderInfo } from "../ports/types";

export type AIProviderHealthSummary = {
  health: AIProviderHealth;
  capabilities: AIProviderCapabilities;
  info: AIProviderInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de OpenAI / Azure / Gemini / Claude / Ollama / LM Studio SDKs.
 */
export async function getAIProviderHealthSummary(
  port: AIProviderPort,
): Promise<AIProviderHealthSummary> {
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
