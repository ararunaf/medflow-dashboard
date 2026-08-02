/**
 * StorageProviderPort — contrato único de persistência documental (STORAGE-01).
 *
 * Application / Storage Manager Runtime dependem exclusivamente desta interface.
 * Detalhes de Supabase Storage / futuros vendors ficam exclusivamente em adapters.
 *
 * STORAGE-01: Storage Provider oficial (backend homologado: Supabase Storage).
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Runtime → OCR Runtime
 *     → Document Classification Runtime → Storage Manager Runtime
 *     → StorageProviderPort → Storage Provider Adapter → Storage Backend
 */
import type {
  StorageDownloadInput,
  StorageDeleteInput,
  StorageMetadataInput,
  StorageProviderConfigurationValidation,
  StorageProviderHealth,
  StorageProviderId,
  StorageProviderInfo,
  StorageProviderOperationResult,
  StorageProviderPortCapabilities,
  StorageSignedUrlInput,
  StorageUploadInput,
} from "./types";

export interface StorageProviderPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: StorageProviderId;

  /** Upload / put de objeto documental. */
  upload(input: StorageUploadInput): Promise<StorageProviderOperationResult>;

  /** Download / get de objeto documental. */
  download(input: StorageDownloadInput): Promise<StorageProviderOperationResult>;

  /** Delete / remove de objeto documental. */
  delete(input: StorageDeleteInput): Promise<StorageProviderOperationResult>;

  /** Metadata / head de objeto documental. */
  metadata(input: StorageMetadataInput): Promise<StorageProviderOperationResult>;

  /** URL assinada temporária (acesso controlado ao objeto). */
  signedUrl(input: StorageSignedUrlInput): Promise<StorageProviderOperationResult>;

  /**
   * URL pública (buckets públicos / branding).
   * Retorna CanonicalStorageResult com signedUrl preenchido com a URL pública.
   */
  publicUrl(input: StorageMetadataInput): Promise<StorageProviderOperationResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<StorageProviderHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): StorageProviderPortCapabilities;

  /** Metadados estáveis do provedor. */
  providerInfo(): StorageProviderInfo;

  /**
   * Valida configuração estrutural do adapter.
   * NÃO realiza chamadas de rede quando backend não exige probe.
   */
  validateConfiguration(): Promise<StorageProviderConfigurationValidation>;
}
