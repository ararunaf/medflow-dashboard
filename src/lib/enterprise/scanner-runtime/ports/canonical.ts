/**
 * Modelos canônicos do Enterprise Scanner Runtime — F3-CAP-01.
 *
 * Foundation estrutural vendor-agnostic para scanners futuros.
 * Sem Scanner real. Sem TWAIN / WIA / ISIS. Sem USB / Rede.
 * Sem Drivers. Sem OCR. Sem Upload. Sem Watch Folder.
 * Sem captura automática. Sem filas. Sem banco. Sem API.
 */

/** Status estrutural de Scanner / sessão / aquisição. */
export type CanonicalScannerStatus =
  | "pending"
  | "registered"
  | "unregistered"
  | "discovered"
  | "session-open"
  | "session-closed"
  | "acquired"
  | "failed"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalScannerIdentity = {
  kind: "canonical-scanner-identity";
  scannerId?: string;
  scannerName?: string;
  sessionId?: string;
  acquisitionId?: string;
  correlationId?: string | null;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalScannerProvider = {
  kind: "canonical-scanner-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica de Scanner / sessão / aquisição.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalScannerMetadata = {
  kind: "canonical-scanner-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Scanner Runtime. */
export type CanonicalScannerOperation =
  | "register"
  | "unregister"
  | "discover"
  | "openSession"
  | "closeSession"
  | "acquire"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Scanner canônico estrutural.
 * Representa a infraestrutura de Scanner — sem hardware, sem drivers.
 */
export type CanonicalScanner = {
  kind: "canonical-scanner";
  scannerId: string;
  scannerName: string;
  identity?: CanonicalScannerIdentity;
  metadata?: CanonicalScannerMetadata;
  status: CanonicalScannerStatus;
  discovered: boolean;
  createdAt: string;
  updatedAt: string;
  /** Sempre false — nenhum Scanner real nesta fundação. */
  scannerImplemented: false;
  twainImplemented: false;
  wiaImplemented: false;
  isisImplemented: false;
  networkScannerImplemented: false;
  driverImplemented: false;
  captureImplemented: false;
};

/**
 * Sessão canônica estrutural (referência apenas — nunca abre driver).
 */
export type CanonicalScannerSession = {
  kind: "canonical-scanner-session";
  sessionId: string;
  scannerId: string;
  identity?: CanonicalScannerIdentity;
  metadata?: CanonicalScannerMetadata;
  status: CanonicalScannerStatus;
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
  scannerImplemented: false;
  twainImplemented: false;
  wiaImplemented: false;
  isisImplemented: false;
  networkScannerImplemented: false;
  driverImplemented: false;
  captureImplemented: false;
};

/**
 * Aquisição canônica estrutural (registro apenas — nunca captura página).
 */
export type CanonicalScannerAcquisition = {
  kind: "canonical-scanner-acquisition";
  acquisitionId: string;
  scannerId: string;
  sessionId?: string;
  identity?: CanonicalScannerIdentity;
  metadata?: CanonicalScannerMetadata;
  status: CanonicalScannerStatus;
  createdAt: string;
  updatedAt: string;
  scannerImplemented: false;
  twainImplemented: false;
  wiaImplemented: false;
  isisImplemented: false;
  networkScannerImplemented: false;
  driverImplemented: false;
  captureImplemented: false;
};

/**
 * Resultado canônico de operação de Scanner Runtime (F3-CAP-01).
 * Contém apenas referência/estrutura canônica — nunca Scanner real.
 */
export type CanonicalScannerResult = {
  kind: "canonical-scanner-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalScannerOperation;
  scanner?: CanonicalScanner;
  session?: CanonicalScannerSession;
  acquisition?: CanonicalScannerAcquisition;
  scanners?: readonly CanonicalScanner[];
  identity?: CanonicalScannerIdentity;
  metadata?: CanonicalScannerMetadata;
  provider?: CanonicalScannerProvider;
  scannerImplemented: false;
  twainImplemented: false;
  wiaImplemented: false;
  isisImplemented: false;
  networkScannerImplemented: false;
  driverImplemented: false;
  captureImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem Scanner real). */
  runtimeReady: true;
  status: CanonicalScannerStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Scanner Runtime (in-process).
 */
export type CanonicalScannerStatistics = {
  kind: "canonical-scanner-statistics";
  totalScanners: number;
  registeredScanners: number;
  discoveredScanners: number;
  openSessions: number;
  closedSessions: number;
  totalAcquisitions: number;
  scannerImplementedCount: 0;
  twainImplementedCount: 0;
  wiaImplementedCount: 0;
  isisImplementedCount: 0;
  networkScannerImplementedCount: 0;
  driverImplementedCount: 0;
  captureImplementedCount: 0;
};

/**
 * Saúde canônica do provedor Scanner Runtime.
 */
export type CanonicalScannerHealth = {
  kind: "canonical-scanner-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedScannerCount?: number;
  storedSessionCount?: number;
  storedAcquisitionCount?: number;
  captureEngineRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  queueRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  tissRuntimeOk?: boolean;
  runtimeReady: true;
  scannerImplemented: false;
  twainImplemented: false;
  wiaImplemented: false;
  isisImplemented: false;
  networkScannerImplemented: false;
  driverImplemented: false;
  captureImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Scanner Runtime.
 */
export type CanonicalScannerCapabilities = {
  kind: "canonical-scanner-capabilities";
  supportsRegister: boolean;
  supportsUnregister: boolean;
  supportsDiscover: boolean;
  supportsOpenSession: boolean;
  supportsCloseSession: boolean;
  supportsAcquire: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalScanner: boolean;
  runtimeReady: true;
  scannerImplemented: false;
  twainImplemented: false;
  wiaImplemented: false;
  isisImplemented: false;
  networkScannerImplemented: false;
  driverImplemented: false;
  captureImplemented: false;
  implementsTwain: false;
  implementsWia: false;
  implementsIsis: false;
  implementsUsb: false;
  implementsNetworkScanner: false;
  implementsWatchFolder: false;
  implementsOcr: false;
  implementsUpload: false;
  implementsHttp: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
