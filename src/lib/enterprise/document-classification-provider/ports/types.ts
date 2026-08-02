/**
 * Tipos vendor-agnósticos da camada Document Classification Provider — CLASS-01.
 *
 * Classificação rule-based exclusivamente.
 * Nunca usa IA / LLM / ML / embeddings / RAG.
 * Nunca chama Azure / OpenAI / Gemini / Claude.
 * Consome apenas resultado produzido pelo OCR Runtime.
 *
 * O Runtime mapeia DocumentClassificationProcessResult → CanonicalDocumentClassificationResult.
 * Sem modelos paralelos de domínio — apenas contrato do Port.
 *
 * Arquitetura obrigatória:
 *   Application → DocumentClassificationProviderPort → Adapter
 *     → Factory → Registry
 */
import type { DocumentClassificationCapabilities } from "./capabilities";

export type { DocumentClassificationCapabilities };

/** Tipos documentais suportados pelo Classification Provider (CLASS-01). */
export type DocumentClassificationType =
  | "guia-tiss"
  | "solicitacao"
  | "prontuario"
  | "laudo"
  | "documento-administrativo"
  | "documento-financeiro"
  | "documento-desconhecido";

/** Provedores / mecanismos de classificação suportados na fundação. */
export type DocumentClassificationProviderId = "mock" | "test" | "default" | "rule-based";

/** Status operacional declarado no registry. */
export type DocumentClassificationProviderStatus =
  | "ready"
  | "stub"
  | "disabled"
  | "unhealthy"
  | "unknown";

/** Telemetria estrutural embutida no resultado (sem SDK externo). */
export type DocumentClassificationTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  matchedRuleCount?: number;
  documentType?: DocumentClassificationType;
};

/** Logging estrutural embutido (sem logger SDK). */
export type DocumentClassificationStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: DocumentClassificationProviderId;
  attempt?: number;
};

/** Resultado de health check. */
export type DocumentClassificationProviderHealth = {
  ok: boolean;
  provider: DocumentClassificationProviderId;
  latencyMs?: number;
  message?: string;
  status?: DocumentClassificationProviderStatus;
};

/**
 * Capacidades do adapter no nível do Port.
 */
export type DocumentClassificationProviderPortCapabilities = {
  provider: DocumentClassificationProviderId;
  adapterId: string;
  classification: DocumentClassificationCapabilities;
  supportsCanonicalResult: boolean;
  supportsOcrRuntimeInput: boolean;
  supportsConfigurableRules: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  implementsAi: false;
  implementsMachineLearning: false;
  implementsEmbeddings: false;
  implementsLlm: false;
};

/** Metadados estáveis do provedor. */
export type DocumentClassificationProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type DocumentClassificationProviderInfo = {
  providerId: DocumentClassificationProviderId;
  metadata: DocumentClassificationProviderMetadata;
  status: DocumentClassificationProviderStatus;
  providerType: "DOCUMENT_CLASSIFICATION";
  capabilities: DocumentClassificationCapabilities;
};

/** Resultado de validateConfiguration(). */
export type DocumentClassificationConfigurationValidation = {
  ok: boolean;
  provider: DocumentClassificationProviderId;
  errors: readonly string[];
  warnings: readonly string[];
  message?: string;
};

/** Regra configurável de classificação (keyword / pattern). */
export type DocumentClassificationRule = {
  id: string;
  documentType: Exclude<DocumentClassificationType, "documento-desconhecido">;
  /** Tokens case-insensitive; basta um match para pontuar a regra. */
  keywords: readonly string[];
  /** Peso relativo da regra (maior = prioridade). */
  weight?: number;
  description?: string;
};

/**
 * Input de classify() — resultado OCR + controles operacionais.
 * Mock/rule-based nunca fazem HTTP / IA.
 */
export type DocumentClassificationProcessInput = {
  requestId?: string;
  /** Texto extraído pelo OCR Runtime (obrigatório para classificação real). */
  ocrText?: string;
  /** structuredData opaco do ProcessingOutput do OCR (alternativa/complemento). */
  ocrStructuredData?: Readonly<Record<string, unknown>>;
  documentId?: string;
  sessionId?: string;
  contentType?: string;
  language?: string;
  /** Cancelamento cooperativo (CLASS-01). */
  signal?: AbortSignal;
  /** Timeout total em ms (CLASS-01). */
  timeoutMs?: number;
  /** Tentativas adicionais após a primeira falha (CLASS-01). */
  retryCount?: number;
  /** Override opcional de regras (configurável). */
  rules?: readonly DocumentClassificationRule[];
  /** Bag livre — adapters não interpretam domínio clínico. */
  attributes?: Readonly<Record<string, unknown>>;
};

/**
 * Resultado de classify() no Port.
 * Runtime promove estes campos para CanonicalDocumentClassificationResult.
 */
export type DocumentClassificationProcessResult = {
  ok: boolean;
  requestId?: string;
  provider: DocumentClassificationProviderId;
  documentType: DocumentClassificationType;
  confidence: number;
  matchedRules: readonly string[];
  message?: string;
  code?: string;
  /** Indica resposta determinística de mock. */
  simulated?: boolean;
  telemetry: DocumentClassificationTelemetry;
  logs?: readonly DocumentClassificationStructuredLog[];
};

/** Opções de resolução do DocumentClassificationProviderPort. */
export type DocumentClassificationProviderOptions = {
  /**
   * Provedor desejado. Default da fundação: `rule-based` (CLASS-01).
   */
  provider?: DocumentClassificationProviderId;
};

/** Entrada de registro no DocumentClassificationProviderRegistry. */
export type DocumentClassificationProviderRegistration = {
  providerId: DocumentClassificationProviderId;
  name: string;
  version: string;
  status: DocumentClassificationProviderStatus;
  adapterId: string;
  vendor: string;
  capabilities: DocumentClassificationCapabilities;
  description?: string;
};
