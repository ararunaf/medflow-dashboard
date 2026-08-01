/**
 * Tipos vendor-agnósticos da camada de AI Providers — EPC-07.
 *
 * Nenhum tipo de OpenAI, Azure, Gemini, Claude, Ollama ou LM Studio
 * deve aparecer aqui. Nenhum conceito clínico / TISS / contrato / guia.
 */
import type { AICapabilityId } from "./capabilities";

export type { AICapabilityId };

/** Provedores de IA suportados (extensível). */
export type AIProviderId =
  | "mock"
  | "test"
  | "openai"
  | "azure-openai"
  | "gemini"
  | "claude"
  | "ollama"
  | "lm-studio";

/** Status operacional declarado no registry. */
export type AIProviderStatus = "ready" | "stub" | "disabled" | "unhealthy";

/** Modalidades genéricas (sem domínio de saúde). */
export type AIModality = "text" | "image" | "audio" | "document" | "embedding";

/** Resultado de health check do provedor. */
export type AIProviderHealth = {
  ok: boolean;
  provider: AIProviderId;
  latencyMs?: number;
  message?: string;
  status?: AIProviderStatus;
};

/**
 * Capacidades declaradas pelo adapter.
 * Usado por Application/Domain para decisões sem conhecer o vendor.
 */
export type AIProviderCapabilities = {
  provider: AIProviderId;
  /** Identificador legível do adapter (ex.: mock-deterministic). */
  adapterId: string;
  /** Lista de capability ids genéricos suportados. */
  capabilities: readonly AICapabilityId[];
  modalities: readonly AIModality[];
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  supportsEmbeddings: boolean;
  supportsToolCalling: boolean;
  supportsJsonMode: boolean;
};

/** Metadados estáveis do provedor (versionamento / identificação). */
export type AIProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type AIProviderInfo = {
  providerId: AIProviderId;
  metadata: AIProviderMetadata;
  status: AIProviderStatus;
  modalities: readonly AIModality[];
  capabilities: readonly AICapabilityId[];
};

/** Uso de tokens genérico (sem vendor). */
export type AITokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

/** Contexto opaco de invocação — sem domínio clínico. */
export type AIContext = {
  correlationId?: string;
  tenantId?: string;
  locale?: string;
  /** Bag livre para consumers futuros; adapters não interpretam domínio. */
  attributes?: Record<string, unknown>;
};

/** Mensagem genérica de conversação / prompt. */
export type AIMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
};

/** Request genérico de invocação. */
export type AIRequest = {
  /** Identificador opcional da operação (trace). */
  requestId?: string;
  model?: string;
  messages?: readonly AIMessage[];
  /** Prompt único quando não há messages. */
  prompt?: string;
  /** Capability desejada (ex.: text-generation). */
  capability?: AICapabilityId;
  temperature?: number;
  maxTokens?: number;
  /** Pedido de saída estruturada / JSON (genérico). */
  responseFormat?: "text" | "json" | "structured";
  stream?: boolean;
  context?: AIContext;
  /** Input opaco adicional (embeddings, vision refs, etc.). */
  input?: unknown;
};

/** Response genérico de invocação. */
export type AIResponse = {
  ok: boolean;
  requestId?: string;
  provider: AIProviderId;
  model?: string;
  content?: string;
  /** Payload estruturado opaco quando responseFormat ≠ text. */
  data?: unknown;
  usage?: AITokenUsage;
  metadata?: AIProviderMetadata;
  message?: string;
  /** Indica resposta determinística de mock/stub (nunca rede). */
  simulated?: boolean;
};

/** Resultado de validateConfiguration(). */
export type AIConfigurationValidation = {
  ok: boolean;
  provider: AIProviderId;
  errors: readonly string[];
  warnings: readonly string[];
  message?: string;
};

/** Opções de resolução do AIProviderPort (provider). */
export type AIProviderOptions = {
  /**
   * Provedor desejado. Default da fundação: `mock`.
   * Stubs vendor existem mas NÃO executam chamadas reais.
   */
  provider?: AIProviderId;
};

/** Entrada de registro no AIProviderRegistry. */
export type AIProviderRegistration = {
  providerId: AIProviderId;
  name: string;
  version: string;
  capabilities: readonly AICapabilityId[];
  modalities: readonly AIModality[];
  status: AIProviderStatus;
  adapterId: string;
  vendor: string;
  description?: string;
};
