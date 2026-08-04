/**
 * Modelos canônicos do Enterprise Watch Folder Runtime — F3-CAP-02.
 *
 * Foundation estrutural vendor-agnostic para watch folders futuros.
 * Sem Watch Folder real. Sem Local / Network / UNC / SMB / Azure Files.
 * Sem FileSystemWatcher. Sem Polling. Sem OCR. Sem Importação automática.
 * Sem monitoramento real. Sem filas. Sem banco. Sem API.
 */

/** Status estrutural de Watch Folder / sessão / observação. */
export type CanonicalWatchFolderStatus =
  | "pending"
  | "registered"
  | "unregistered"
  | "discovered"
  | "session-open"
  | "session-closed"
  | "observed"
  | "failed"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalWatchFolderIdentity = {
  kind: "canonical-watch-folder-identity";
  watchFolderId?: string;
  watchFolderName?: string;
  folderPath?: string;
  sessionId?: string;
  observationId?: string;
  correlationId?: string | null;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalWatchFolderProvider = {
  kind: "canonical-watch-folder-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica de Watch Folder / sessão / observação.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalWatchFolderMetadata = {
  kind: "canonical-watch-folder-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Watch Folder Runtime. */
export type CanonicalWatchFolderOperation =
  | "register"
  | "unregister"
  | "discover"
  | "openSession"
  | "closeSession"
  | "observe"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Watch Folder canônico estrutural.
 * Representa a infraestrutura de Watch Folder — sem monitoramento real.
 */
export type CanonicalWatchFolder = {
  kind: "canonical-watch-folder";
  watchFolderId: string;
  watchFolderName: string;
  /** Caminho estrutural opaco — nunca lido do filesystem nesta fundação. */
  folderPath?: string;
  identity?: CanonicalWatchFolderIdentity;
  metadata?: CanonicalWatchFolderMetadata;
  status: CanonicalWatchFolderStatus;
  discovered: boolean;
  createdAt: string;
  updatedAt: string;
  /** Sempre false — nenhum Watch Folder real nesta fundação. */
  localWatchImplemented: false;
  networkWatchImplemented: false;
  uncImplemented: false;
  smbImplemented: false;
  azureFilesImplemented: false;
  pollingImplemented: false;
  fileSystemWatcherImplemented: false;
  recursiveWatchImplemented: false;
  changeNotificationImplemented: false;
  automaticImportImplemented: false;
};

/**
 * Sessão canônica estrutural (referência apenas — nunca abre watcher).
 */
export type CanonicalWatchFolderSession = {
  kind: "canonical-watch-folder-session";
  sessionId: string;
  watchFolderId: string;
  identity?: CanonicalWatchFolderIdentity;
  metadata?: CanonicalWatchFolderMetadata;
  status: CanonicalWatchFolderStatus;
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
  localWatchImplemented: false;
  networkWatchImplemented: false;
  uncImplemented: false;
  smbImplemented: false;
  azureFilesImplemented: false;
  pollingImplemented: false;
  fileSystemWatcherImplemented: false;
  recursiveWatchImplemented: false;
  changeNotificationImplemented: false;
  automaticImportImplemented: false;
};

/**
 * Observação canônica estrutural (registro apenas — nunca observa filesystem).
 */
export type CanonicalWatchFolderObservation = {
  kind: "canonical-watch-folder-observation";
  observationId: string;
  watchFolderId: string;
  sessionId?: string;
  identity?: CanonicalWatchFolderIdentity;
  metadata?: CanonicalWatchFolderMetadata;
  status: CanonicalWatchFolderStatus;
  createdAt: string;
  updatedAt: string;
  localWatchImplemented: false;
  networkWatchImplemented: false;
  uncImplemented: false;
  smbImplemented: false;
  azureFilesImplemented: false;
  pollingImplemented: false;
  fileSystemWatcherImplemented: false;
  recursiveWatchImplemented: false;
  changeNotificationImplemented: false;
  automaticImportImplemented: false;
};

/**
 * Resultado canônico de operação de Watch Folder Runtime (F3-CAP-02).
 * Contém apenas referência/estrutura canônica — nunca Watch Folder real.
 */
export type CanonicalWatchFolderResult = {
  kind: "canonical-watch-folder-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalWatchFolderOperation;
  watchFolder?: CanonicalWatchFolder;
  session?: CanonicalWatchFolderSession;
  observation?: CanonicalWatchFolderObservation;
  watchFolders?: readonly CanonicalWatchFolder[];
  identity?: CanonicalWatchFolderIdentity;
  metadata?: CanonicalWatchFolderMetadata;
  provider?: CanonicalWatchFolderProvider;
  localWatchImplemented: false;
  networkWatchImplemented: false;
  uncImplemented: false;
  smbImplemented: false;
  azureFilesImplemented: false;
  pollingImplemented: false;
  fileSystemWatcherImplemented: false;
  recursiveWatchImplemented: false;
  changeNotificationImplemented: false;
  automaticImportImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem Watch Folder real). */
  runtimeReady: true;
  status: CanonicalWatchFolderStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Watch Folder Runtime (in-process).
 */
export type CanonicalWatchFolderStatistics = {
  kind: "canonical-watch-folder-statistics";
  totalWatchFolders: number;
  registeredWatchFolders: number;
  discoveredWatchFolders: number;
  openSessions: number;
  closedSessions: number;
  totalObservations: number;
  localWatchImplementedCount: 0;
  networkWatchImplementedCount: 0;
  uncImplementedCount: 0;
  smbImplementedCount: 0;
  azureFilesImplementedCount: 0;
  pollingImplementedCount: 0;
  fileSystemWatcherImplementedCount: 0;
  recursiveWatchImplementedCount: 0;
  changeNotificationImplementedCount: 0;
  automaticImportImplementedCount: 0;
};

/**
 * Saúde canônica do provedor Watch Folder Runtime.
 */
export type CanonicalWatchFolderHealth = {
  kind: "canonical-watch-folder-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedWatchFolderCount?: number;
  storedSessionCount?: number;
  storedObservationCount?: number;
  scannerRuntimeOk?: boolean;
  captureEngineRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  runtimeReady: true;
  localWatchImplemented: false;
  networkWatchImplemented: false;
  uncImplemented: false;
  smbImplemented: false;
  azureFilesImplemented: false;
  pollingImplemented: false;
  fileSystemWatcherImplemented: false;
  recursiveWatchImplemented: false;
  changeNotificationImplemented: false;
  automaticImportImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Watch Folder Runtime.
 */
export type CanonicalWatchFolderCapabilities = {
  kind: "canonical-watch-folder-capabilities";
  supportsRegister: boolean;
  supportsUnregister: boolean;
  supportsDiscover: boolean;
  supportsOpenSession: boolean;
  supportsCloseSession: boolean;
  supportsObserve: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalWatchFolder: boolean;
  runtimeReady: true;
  localWatchImplemented: false;
  networkWatchImplemented: false;
  uncImplemented: false;
  smbImplemented: false;
  azureFilesImplemented: false;
  pollingImplemented: false;
  fileSystemWatcherImplemented: false;
  recursiveWatchImplemented: false;
  changeNotificationImplemented: false;
  automaticImportImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
