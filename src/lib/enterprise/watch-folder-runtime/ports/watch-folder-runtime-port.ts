/**
 * WatchFolderRuntimePort — contrato único do Enterprise Watch Folder Runtime (F3-CAP-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para gerenciar Watch Folders canônicos estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → WatchFolderRuntimePort
 *     → Adapter → Watch Folder Runtime Store → Canonical Watch Folder Result
 *
 * F3-CAP-02: infraestrutura canônica apenas — sem Watch Folder real /
 * Local / Network / UNC / SMB / Azure Files / FileSystemWatcher / Polling.
 */
import type {
  ObserveWatchFolderInput,
  ObserveWatchFolderResult,
  CloseWatchFolderSessionInput,
  CloseWatchFolderSessionResult,
  DiscoverWatchFoldersInput,
  DiscoverWatchFoldersResult,
  OpenWatchFolderSessionInput,
  OpenWatchFolderSessionResult,
  RegisterWatchFolderInput,
  RegisterWatchFolderResult,
  WatchFolderRuntimeHealth,
  WatchFolderRuntimeInfo,
  WatchFolderRuntimePortCapabilities,
  WatchFolderRuntimeProviderId,
  WatchFolderStatsInput,
  WatchFolderStatsResult,
  UnregisterWatchFolderInput,
  UnregisterWatchFolderResult,
} from "./types";

export interface WatchFolderRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: WatchFolderRuntimeProviderId;

  /**
   * Registra estruturalmente um Watch Folder no store in-memory.
   * NÃO abre FileSystemWatcher. NÃO faz polling. NÃO lê arquivos.
   */
  register(input: RegisterWatchFolderInput): Promise<RegisterWatchFolderResult>;

  /**
   * Remove estruturalmente um Watch Folder do store.
   * NÃO libera watchers reais (não há watchers).
   */
  unregister(input: UnregisterWatchFolderInput): Promise<UnregisterWatchFolderResult>;

  /**
   * Descoberta estrutural de Watch Folders (catálogo in-memory).
   * NÃO enumera Local/Network/UNC/SMB/Azure Files/NAS.
   */
  discover(input?: DiscoverWatchFoldersInput): Promise<DiscoverWatchFoldersResult>;

  /**
   * Abre sessão estrutural de Watch Folder.
   * NÃO abre watcher. NÃO aloca filesystem handles.
   */
  openSession(input: OpenWatchFolderSessionInput): Promise<OpenWatchFolderSessionResult>;

  /**
   * Fecha sessão estrutural de Watch Folder.
   * NÃO fecha watchers reais.
   */
  closeSession(input: CloseWatchFolderSessionInput): Promise<CloseWatchFolderSessionResult>;

  /**
   * Observação estrutural (registro canônico apenas).
   * NÃO monitora pasta. NÃO invoca OCR. NÃO importa documentos.
   */
  observe(input: ObserveWatchFolderInput): Promise<ObserveWatchFolderResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: WatchFolderStatsInput): Promise<WatchFolderStatsResult>;

  /** Verificação leve de prontidão (sem alterar Watch Folders). */
  health(): Promise<WatchFolderRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): WatchFolderRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): WatchFolderRuntimeInfo;
}
