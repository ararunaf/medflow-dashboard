/**
 * SearchProviderPort — contrato único de busca documental (SEARCH-01).
 *
 * Application / Document Search Runtime dependem exclusivamente desta interface.
 * Detalhes de catálogo / Storage ficam exclusivamente em adapters.
 *
 * SEARCH-01: Search Provider oficial (storage-backed).
 * Sem Elastic / OpenSearch / Azure Search / Supabase / S3 / FS diretos.
 * Backend documental exclusivamente via StorageProviderPort.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Runtime
 *     → Document Search Runtime → SearchProviderPort
 *     → DefaultSearchProviderAdapter → StorageProviderPort → Backend oficial
 */
import type {
  SearchProviderConfigurationValidation,
  SearchProviderHealth,
  SearchProviderId,
  SearchProviderInfo,
  SearchProviderPortCapabilities,
  SearchProcessInput,
  SearchProviderOperationResult,
} from "./types";

export interface SearchProviderPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: SearchProviderId;

  /**
   * Busca documental canônica.
   * Retorna CanonicalSearchResult (sem modelos paralelos).
   */
  search(input: SearchProcessInput): Promise<SearchProviderOperationResult>;

  /**
   * Indexa / registra documento pesquisável no catálogo do adapter.
   * Usa StorageProviderPort para validar existência quando houver storageKey.
   */
  indexDocument(document: import("./canonical").CanonicalSearchDocument): Promise<{
    ok: boolean;
    message?: string;
    code?: string;
  }>;

  /** Verificação leve de prontidão. */
  health(): Promise<SearchProviderHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): SearchProviderPortCapabilities;

  /** Metadados estáveis do provedor. */
  providerInfo(): SearchProviderInfo;

  /**
   * Valida configuração estrutural do adapter.
   * NÃO realiza chamadas a motores de busca externos.
   */
  validateConfiguration(): Promise<SearchProviderConfigurationValidation>;
}
