/**
 * Tipos vendor-agnósticos da camada TISS Provider — TISS-01.
 *
 * Processamento TISS exclusivamente via TISSProviderPort → Adapter.
 * Nunca acessa banco / Storage / OCR / XML de operadora diretamente.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSProviderPort → DefaultTISSProviderAdapter → Implementação oficial
 */
import type {
  CanonicalTISSMetadata,
  CanonicalTISSMode,
  CanonicalTISSProfileReference,
  CanonicalTISSProviderReference,
  CanonicalTISSRequest,
  CanonicalTISSResult,
} from "./canonical";
import type { TISSProviderCapabilities } from "./capabilities";

export type {
  CanonicalTISSMetadata,
  CanonicalTISSMode,
  CanonicalTISSProfileReference,
  CanonicalTISSProviderReference,
  CanonicalTISSRequest,
  CanonicalTISSResult,
};
export type { TISSProviderCapabilities };

/** Provedores / mecanismos TISS suportados na fundação. */
export type TISSProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type TISSProviderStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (sem SDK externo). */
export type TISSProviderTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  mode?: CanonicalTISSMode;
};

/** Logging estrutural embutido (sem logger SDK). */
export type TISSProviderStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: TISSProviderId;
  attempt?: number;
  mode?: CanonicalTISSMode;
};

/** Resultado de health check. */
export type TISSProviderHealth = {
  ok: boolean;
  provider: TISSProviderId;
  latencyMs?: number;
  message?: string;
  status?: TISSProviderStatus;
};

/**
 * Capacidades do adapter no nível do Port.
 */
export type TISSProviderPortCapabilities = {
  provider: TISSProviderId;
  adapterId: string;
  tiss: TISSProviderCapabilities;
  supportsCanonicalResult: boolean;
  supportsStructuralProcess: boolean;
  supportsResolveProfile: boolean;
  supportsResolveProvider: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  implementsRealXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsClinicalValidation: false;
};

/** Metadados estáveis do provedor. */
export type TISSProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type TISSProviderInfo = {
  providerId: TISSProviderId;
  metadata: TISSProviderMetadata;
  status: TISSProviderStatus;
  providerType: "TISS";
  capabilities: TISSProviderCapabilities;
};

/** Resultado de validateConfiguration(). */
export type TISSProviderConfigurationValidation = {
  ok: boolean;
  provider: TISSProviderId;
  errors: readonly string[];
  warnings: readonly string[];
  message?: string;
};

/**
 * Input de process() — pedido canônico + controles operacionais.
 * Nunca faz XML / HTTP a operadoras.
 */
export type TISSProcessInput = CanonicalTISSRequest & {
  requestId?: string;
  /** Cancelamento cooperativo (TISS-01). */
  signal?: AbortSignal;
  /** Timeout total em ms (TISS-01). */
  timeoutMs?: number;
  /** Tentativas adicionais após a primeira falha (TISS-01). */
  retryCount?: number;
  /** Bag livre — adapters não interpretam domínio clínico/operadora. */
  attributes?: Readonly<Record<string, unknown>>;
};

/**
 * Resultado de process() no Port.
 * Runtime promove estes campos para o resultado de coordenação.
 */
export type TISSProviderOperationResult = CanonicalTISSResult & {
  provider: TISSProviderId;
  telemetry: TISSProviderTelemetry;
  logs?: readonly TISSProviderStructuredLog[];
  /** Indica resposta determinística de mock. */
  simulated?: boolean;
};

/** Opções de resolução do TISSProviderPort. */
export type TISSProviderOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-01).
   */
  provider?: TISSProviderId;
};

/** Entrada de registro no TISSProviderRegistry. */
export type TISSProviderRegistration = {
  providerId: TISSProviderId;
  name: string;
  version: string;
  status: TISSProviderStatus;
  adapterId: string;
  vendor: string;
  capabilities: TISSProviderCapabilities;
  description?: string;
};
