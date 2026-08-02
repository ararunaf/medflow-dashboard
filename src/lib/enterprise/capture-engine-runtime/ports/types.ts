/**
 * Tipos vendor-agnósticos do Capture Engine Runtime — DIP-02 / DIP-03 / DIP-04 / DIP-05.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → CaptureEngineRuntimePort
 *     → Canonical Execution Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação
 *     → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural)
 *     → DocumentClassificationRuntimePort → Orchestrator
 *     → Classification Provider Adapter (referência estrutural)
 *     → StorageManagerRuntimePort → Orchestrator
 *     → Storage Provider Adapter (referência estrutural)
 *
 * Este componente NÃO reimplementa intake nem processamento documental.
 * NÃO executa OCR nem classificação nem armazenamento. Coordena via Ports oficiais.
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { DocumentClassificationRuntimePort } from "../../document-classification-runtime/ports/document-classification-runtime-port";
import type { DocumentIntakeRuntimePort } from "../../document-intake-runtime/ports/document-intake-runtime-port";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { StorageManagerRuntimePort } from "../../storage-manager-runtime/ports/storage-manager-runtime-port";
import type {
  CanonicalCaptureRequest,
  CanonicalCaptureResult,
  CanonicalCaptureSession,
  CaptureEngineRuntimeSessionStatus,
} from "./models";

export type {
  CanonicalCaptureCapabilities,
  CanonicalCaptureConfiguration,
  CanonicalCaptureIdentity,
  CanonicalCaptureMetadata,
  CanonicalCaptureReference,
  CanonicalCaptureRequest,
  CanonicalCaptureResult,
  CanonicalCaptureSession,
  CaptureEngineRuntimeSessionStatus,
} from "./models";

/** Provedores / mecanismos do Capture Engine Runtime. */
export type CaptureEngineRuntimeProviderId = "default" | "mock" | "test";

/** Resultado de health check. */
export type CaptureEngineRuntimeHealth = {
  ok: boolean;
  provider: CaptureEngineRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  enterpriseOrchestratorOk?: boolean;
  documentIntakeRuntimeOk?: boolean;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 */
export type CaptureEngineRuntimeCapabilities = {
  provider: CaptureEngineRuntimeProviderId;
  adapterId: string;
  supportsRegisterCapture: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesDocumentIntakeRuntime: boolean;
  usesDocumentIntakePort: boolean;
  usesOCRRuntime: boolean;
  usesDocumentClassificationRuntime: boolean;
  usesStorageManagerRuntime: boolean;
  implementsOcr: false;
  implementsAi: false;
  implementsXml: false;
  implementsTiss: false;
  implementsParser: false;
  implementsClassification: false;
  implementsWorkflow: false;
  implementsRuleEngine: false;
  implementsStorageManager: false;
  implementsVersioning: false;
  implementsSearch: false;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type CaptureEngineRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  getDocumentIntakeRuntimePort(): DocumentIntakeRuntimePort;
  /** DIP-03 — coordenação estrutural OCR (sem OCR real). */
  getOCRRuntimePort(): OCRRuntimePort;
  /** DIP-04 — coordenação estrutural de classificação (sem classificação real). */
  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort;
  /** DIP-05 — coordenação estrutural de storage (sem armazenamento real). */
  getStorageManagerRuntimePort(): StorageManagerRuntimePort;
};

export type GetCaptureRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetCaptureRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalCaptureSession;
  message?: string;
  code?: string;
};

export type ListCaptureRuntimeSessionsInput = {
  status?: CaptureEngineRuntimeSessionStatus;
  documentId?: string;
  sessionId?: string;
  idPrefix?: string;
};

export type ListCaptureRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalCaptureSession[];
  message?: string;
  code?: string;
};

/** Alias tipado da operação principal. */
export type RegisterCaptureInput = CanonicalCaptureRequest;
export type RegisterCaptureResult = CanonicalCaptureResult;

/** Opções de resolução do CaptureEngineRuntimePort. */
export type CaptureEngineRuntimeProviderOptions = {
  provider?: CaptureEngineRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: CaptureEngineRuntimeEnterpriseDeps;
};
