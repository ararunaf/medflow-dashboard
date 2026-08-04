/**
 * UploadRuntimePort — contrato único do Enterprise Upload Runtime (F3-CAP-03).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para gerenciar uploads canônicos estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → UploadRuntimePort
 *     → Adapter → Upload Runtime Store → Canonical Upload Result
 *
 * F3-CAP-03: infraestrutura canônica apenas — sem Upload real /
 * Local / Network / UNC / SMB / Azure Files / FileSystemWatcher / Polling.
 */
import type {
  ReceiveUploadInput,
  ReceiveUploadResult,
  CloseUploadSessionInput,
  CloseUploadSessionResult,
  DiscoverUploadsInput,
  DiscoverUploadsResult,
  OpenUploadSessionInput,
  OpenUploadSessionResult,
  RegisterUploadInput,
  RegisterUploadResult,
  UploadRuntimeHealth,
  UploadRuntimeInfo,
  UploadRuntimePortCapabilities,
  UploadRuntimeProviderId,
  UploadStatsInput,
  UploadStatsResult,
  UnregisterUploadInput,
  UnregisterUploadResult,
} from "./types";

export interface UploadRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: UploadRuntimeProviderId;

  /**
   * Registra estruturalmente um Upload no store in-memory.
   * NÃO abre FileSystemWatcher. NÃO faz polling. NÃO lê arquivos.
   */
  register(input: RegisterUploadInput): Promise<RegisterUploadResult>;

  /**
   * Remove estruturalmente um Upload do store.
   * NÃO libera watchers reais (não há watchers).
   */
  unregister(input: UnregisterUploadInput): Promise<UnregisterUploadResult>;

  /**
   * Descoberta estrutural de uploads (catálogo in-memory).
   * NÃO enumera Local/Network/UNC/SMB/Azure Files/NAS.
   */
  discover(input?: DiscoverUploadsInput): Promise<DiscoverUploadsResult>;

  /**
   * Abre sessão estrutural de upload.
   * NÃO abre watcher. NÃO aloca filesystem handles.
   */
  openSession(input: OpenUploadSessionInput): Promise<OpenUploadSessionResult>;

  /**
   * Fecha sessão estrutural de upload.
   * NÃO fecha watchers reais.
   */
  closeSession(input: CloseUploadSessionInput): Promise<CloseUploadSessionResult>;

  /**
   * Observação estrutural (registro canônico apenas).
   * NÃO monitora pasta. NÃO invoca OCR. NÃO importa documentos.
   */
  receive(input: ReceiveUploadInput): Promise<ReceiveUploadResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: UploadStatsInput): Promise<UploadStatsResult>;

  /** Verificação leve de prontidão (sem alterar uploads). */
  health(): Promise<UploadRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): UploadRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): UploadRuntimeInfo;
}
