/**
 * StorageManagerRuntimePort — contrato único do Storage Manager Runtime (DIP-05 / STORAGE-01).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime / OCR Runtime /
 * Document Classification Runtime dependem exclusivamente desta interface
 * para coordenação e persistência documental.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → StorageManagerRuntimePort
 *     → Canonical Execution Orchestrator
 *     → StorageProviderPort
 *     → Storage Provider Adapter
 *     → Storage Backend
 *
 * Persistência real exclusivamente via StorageProviderPort (STORAGE-01).
 * Sem bypass. Sem acesso direto a Supabase/Azure/AWS/GCS pelo produto.
 */
import type {
  CoordinateStorageInput,
  CoordinateStorageResult,
  GetStorageManagerRuntimeSessionInput,
  GetStorageManagerRuntimeSessionResult,
  ListStorageManagerRuntimeSessionsInput,
  ListStorageManagerRuntimeSessionsResult,
  ListStorageProviderReferencesResult,
  StorageManagerDeleteInput,
  StorageManagerDownloadInput,
  StorageManagerMetadataInput,
  StorageManagerProviderOperationResult,
  StorageManagerRuntimeCapabilities,
  StorageManagerRuntimeHealth,
  StorageManagerRuntimeProviderId,
  StorageManagerUploadInput,
} from "./types";

export interface StorageManagerRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: StorageManagerRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<StorageManagerRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): StorageManagerRuntimeCapabilities;

  /**
   * Coordena uma sessão de storage via Orchestrator + Classification Runtime
   * + StorageProviderPort (STORAGE-01).
   */
  coordinateStorage(input: CoordinateStorageInput): Promise<CoordinateStorageResult>;

  /** Upload real via StorageProviderPort. */
  upload(input: StorageManagerUploadInput): Promise<StorageManagerProviderOperationResult>;

  /** Download real via StorageProviderPort. */
  download(input: StorageManagerDownloadInput): Promise<StorageManagerProviderOperationResult>;

  /** Delete real via StorageProviderPort. */
  delete(input: StorageManagerDeleteInput): Promise<StorageManagerProviderOperationResult>;

  /** Metadata real via StorageProviderPort. */
  metadata(input: StorageManagerMetadataInput): Promise<StorageManagerProviderOperationResult>;

  /** Obtém sessão de storage por id. */
  getSession(
    input: GetStorageManagerRuntimeSessionInput,
  ): Promise<GetStorageManagerRuntimeSessionResult>;

  /** Lista sessões de storage (filtros estruturais opcionais). */
  listSessions(
    input?: ListStorageManagerRuntimeSessionsInput,
  ): Promise<ListStorageManagerRuntimeSessionsResult>;

  /** Lista referências a Storage Providers. */
  listProviderReferences(): Promise<ListStorageProviderReferencesResult>;
}
