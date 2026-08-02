/**
 * StorageManagerRuntimePort — contrato único do Storage Manager Runtime (DIP-05).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime / OCR Runtime /
 * Document Classification Runtime dependem exclusivamente desta interface
 * para coordenação estrutural de armazenamento.
 *
 * Fluxo obrigatório (sem implementação paralela / sem armazenamento real):
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → StorageManagerRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Storage Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * NÃO armazena arquivos. NÃO faz upload/download.
 * NÃO integra Supabase Storage / Azure Blob / AWS S3 / GCS / SharePoint / NAS.
 * NÃO implementa versionamento funcional nem retenção automática.
 */
import type {
  CoordinateStorageInput,
  CoordinateStorageResult,
  GetStorageManagerRuntimeSessionInput,
  GetStorageManagerRuntimeSessionResult,
  ListStorageManagerRuntimeSessionsInput,
  ListStorageManagerRuntimeSessionsResult,
  ListStorageProviderReferencesResult,
  StorageManagerRuntimeCapabilities,
  StorageManagerRuntimeHealth,
  StorageManagerRuntimeProviderId,
} from "./types";

export interface StorageManagerRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: StorageManagerRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<StorageManagerRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo (storage tecnológico = FALSE). */
  capabilities(): StorageManagerRuntimeCapabilities;

  /**
   * Coordena estruturalmente uma sessão de storage via Orchestrator + Classification Runtime.
   * NÃO armazena arquivos. NÃO invoca Storage Provider real. NÃO faz upload.
   */
  coordinateStorage(input: CoordinateStorageInput): Promise<CoordinateStorageResult>;

  /** Obtém sessão de storage por id. */
  getSession(
    input: GetStorageManagerRuntimeSessionInput,
  ): Promise<GetStorageManagerRuntimeSessionResult>;

  /** Lista sessões de storage (filtros estruturais opcionais). */
  listSessions(
    input?: ListStorageManagerRuntimeSessionsInput,
  ): Promise<ListStorageManagerRuntimeSessionsResult>;

  /** Lista referências estruturais a Storage Providers futuros (sem conexão). */
  listProviderReferences(): Promise<ListStorageProviderReferencesResult>;
}
