/**
 * AIProviderPort — contrato único de integração com provedores de IA (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de OpenAI / Azure OpenAI / Gemini / Claude / Ollama / LM Studio
 * ficam nos adapters.
 *
 * EPC-07: fundação arquitetural. NÃO implementa OCR, Auditor Inteligente,
 * análise de guias, contratos, prompts clínicos ou chamadas HTTP reais.
 */
import type { AICapabilityId } from "./capabilities";
import type {
  AIConfigurationValidation,
  AIProviderCapabilities,
  AIProviderHealth,
  AIProviderId,
  AIProviderInfo,
  AIRequest,
  AIResponse,
} from "./types";

export interface AIProviderPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: AIProviderId;

  /** Invocação genérica (mock/stub nesta sprint — sem rede). */
  invoke(request: AIRequest): Promise<AIResponse>;

  /** Verificação leve de prontidão do provedor (sem I/O externo na fundação). */
  health(): Promise<AIProviderHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AIProviderCapabilities;

  /** Metadados estáveis do provedor (nome, versão, status). */
  providerInfo(): AIProviderInfo;

  /** Verifica se uma capability genérica é suportada. */
  supports(capability: AICapabilityId): boolean;

  /**
   * Valida configuração estrutural do adapter.
   * NÃO realiza chamadas de rede nem usa chaves de API reais.
   */
  validateConfiguration(): Promise<AIConfigurationValidation>;
}
