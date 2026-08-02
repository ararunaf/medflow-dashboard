/**
 * Tipos vendor-agnósticos da camada Search Provider — SEARCH-01.
 *
 * Busca documental exclusivamente via SearchProviderPort → Adapter → StorageProviderPort.
 * Nunca acessa Supabase / Azure / S3 / banco / filesystem diretamente.
 *
 * Arquitetura obrigatória:
 *   Application → SearchProviderPort → Adapter → StorageProviderPort → Backend oficial
 */
import type { StorageProviderPort } from "../../storage-provider/ports/storage-provider-port";
import type {
  CanonicalSearchDocument,
  CanonicalSearchMetadata,
  CanonicalSearchMode,
  CanonicalSearchRequest,
  CanonicalSearchResult,
} from "./canonical";
import type { SearchProviderCapabilities } from "./capabilities";

export type {
  CanonicalSearchDocument,
  CanonicalSearchMetadata,
  CanonicalSearchMode,
  CanonicalSearchRequest,
  CanonicalSearchResult,
};
export type { SearchProviderCapabilities };

/** Provedores / mecanismos de search suportados na fundação. */
export type SearchProviderId = "mock" | "test" | "default" | "storage-backed";

/** Status operacional declarado no registry. */
export type SearchProviderStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (sem SDK externo). */
export type SearchProviderTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  mode?: CanonicalSearchMode;
  hitCount?: number;
  storageLookups?: number;
};

/** Logging estrutural embutido (sem logger SDK). */
export type SearchProviderStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: SearchProviderId;
  attempt?: number;
  mode?: CanonicalSearchMode;
};

/** Resultado de health check. */
export type SearchProviderHealth = {
  ok: boolean;
  provider: SearchProviderId;
  latencyMs?: number;
  message?: string;
  status?: SearchProviderStatus;
  storageProviderOk?: boolean;
};

/**
 * Capacidades do adapter no nível do Port.
 */
export type SearchProviderPortCapabilities = {
  provider: SearchProviderId;
  adapterId: string;
  search: SearchProviderCapabilities;
  supportsCanonicalResult: boolean;
  supportsStorageProviderBackend: boolean;
  supportsSearchById: boolean;
  supportsSearchByDocument: boolean;
  supportsSearchByPatient: boolean;
  supportsSearchByMetadata: boolean;
  supportsSearchByTenant: boolean;
  supportsSearchByCompetencia: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  implementsExternalSearchEngine: false;
  implementsElasticsearch: false;
  implementsOpenSearch: false;
  implementsAzureSearch: false;
};

/** Metadados estáveis do provedor. */
export type SearchProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type SearchProviderInfo = {
  providerId: SearchProviderId;
  metadata: SearchProviderMetadata;
  status: SearchProviderStatus;
  providerType: "DOCUMENT_SEARCH";
  capabilities: SearchProviderCapabilities;
};

/** Resultado de validateConfiguration(). */
export type SearchProviderConfigurationValidation = {
  ok: boolean;
  provider: SearchProviderId;
  errors: readonly string[];
  warnings: readonly string[];
  message?: string;
};

/**
 * Input de search() — pedido canônico + controles operacionais.
 * Nunca faz HTTP direto a motores de busca externos.
 */
export type SearchProcessInput = CanonicalSearchRequest & {
  requestId?: string;
  /** Cancelamento cooperativo (SEARCH-01). */
  signal?: AbortSignal;
  /** Timeout total em ms (SEARCH-01). */
  timeoutMs?: number;
  /** Tentativas adicionais após a primeira falha (SEARCH-01). */
  retryCount?: number;
  /** Bag livre — adapters não interpretam domínio clínico. */
  attributes?: Readonly<Record<string, unknown>>;
};

/**
 * Resultado de search() no Port.
 * Runtime promove estes campos para o resultado de coordenação.
 */
export type SearchProviderOperationResult = CanonicalSearchResult & {
  provider: SearchProviderId;
  telemetry: SearchProviderTelemetry;
  logs?: readonly SearchProviderStructuredLog[];
  /** Indica resposta determinística de mock. */
  simulated?: boolean;
};

/** Opções de resolução do SearchProviderPort. */
export type SearchProviderOptions = {
  /**
   * Provedor desejado. Default da fundação: `storage-backed` (SEARCH-01).
   */
  provider?: SearchProviderId;
  /**
   * Storage Provider oficial — único backend autorizado para I/O documental.
   * Obrigatório para `default` / `storage-backed` em produção.
   */
  storageProviderPort?: StorageProviderPort;
  /** Catálogo inicial (testes / seed). */
  seedDocuments?: readonly CanonicalSearchDocument[];
};

/** Entrada de registro no SearchProviderRegistry. */
export type SearchProviderRegistration = {
  providerId: SearchProviderId;
  name: string;
  version: string;
  status: SearchProviderStatus;
  adapterId: string;
  vendor: string;
  capabilities: SearchProviderCapabilities;
  description?: string;
};
