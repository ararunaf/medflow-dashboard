/**
 * AIProviderPort — contrato único de integração com provedores de IA (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de OpenAI / Azure OpenAI / Gemini / Claude / Ollama / LM Studio
 * ficam nos adapters.
 *
 * ARCH-02: qualquer chamada HTTP a LLM ocorre exclusivamente nos Adapters oficiais
 * atrás deste Port. Produto NÃO pode chamar providers diretamente.
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

  /** Invocação genérica via Adapter oficial (OpenAI real; demais vendors stub). */
  invoke(request: AIRequest): Promise<AIResponse>;

  /** Verificação leve de prontidão do provedor. */
  health(): Promise<AIProviderHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AIProviderCapabilities;

  /** Metadados estáveis do provedor (nome, versão, status). */
  providerInfo(): AIProviderInfo;

  /** Verifica se uma capability genérica é suportada. */
  supports(capability: AICapabilityId): boolean;

  /**
   * Valida configuração estrutural do adapter.
   * Pode inspecionar presença de chave no ambiente; NÃO realiza chamadas de rede.
   */
  validateConfiguration(): Promise<AIConfigurationValidation>;
}
