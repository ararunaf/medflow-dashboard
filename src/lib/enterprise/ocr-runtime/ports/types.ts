/**
 * Tipos vendor-agnósticos do OCR Runtime — DIP-03 / OCR-01.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCRRuntimePort → Canonical Execution Orchestrator
 *     → OCRProviderPort → AzureDocumentIntelligenceAdapter → Azure
 *
 * Este componente NÃO contém HTTP Azure. Extração real via OCRProviderPort.
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { OCRProviderPort } from "../../ocr-provider/ports/ocr-provider-port";
import type { OCRProcessInput } from "../../ocr-provider/ports/types";
import type {
  CanonicalOCRProviderReference,
  CanonicalOCRProviderReferenceId,
  CanonicalOCRRequest,
  CanonicalOCRResult,
  CanonicalOCRSession,
  OCRRuntimeSessionStatus,
} from "./models";

export type {
  CanonicalOCRCapabilities,
  CanonicalOCRConfiguration,
  CanonicalOCRIdentity,
  CanonicalOCRMetadata,
  CanonicalOCRProviderReference,
  CanonicalOCRProviderReferenceId,
  CanonicalOCRReference,
  CanonicalOCRRequest,
  CanonicalOCRResult,
  CanonicalOCRSession,
  OCRRuntimeSessionStatus,
} from "./models";

/** Provedores / mecanismos do OCR Runtime (adapters do Port — não vendors OCR). */
export type OCRRuntimeProviderId = "default" | "mock" | "test";

/** Resultado de health check. */
export type OCRRuntimeHealth = {
  ok: boolean;
  provider: OCRRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  enterpriseOrchestratorOk?: boolean;
  ocrProviderAdapterOk?: boolean;
  /** true quando OCRProviderPort pode executar OCR real (ex.: azure). */
  realOcrAvailable: boolean;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Runtime permanece desacoplado de vendors — Azure só no OCRProviderPort Adapter.
 */
export type OCRRuntimeCapabilities = {
  provider: OCRRuntimeProviderId;
  adapterId: string;
  supportsCoordinateOcr: boolean;
  supportsProcess: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesOCRProviderAdapter: boolean;
  usesCaptureEngineRuntime: boolean;
  supportsPdf: boolean;
  supportsImage: boolean;
  supportsBatch: boolean;
  supportsStreaming: boolean;
  supportsHandwriting: boolean;
  supportsTables: boolean;
  supportsForms: boolean;
  supportsConfidenceScore: boolean;
  /** Runtime pode acionar OCR real via OCRProviderPort.process(). */
  implementsRealOcr: boolean;
  /** Runtime NÃO implementa Azure — Adapter do OCRProviderPort implementa. */
  implementsAzure: false;
  implementsGoogleVision: false;
  implementsAwsTextract: false;
  implementsTesseract: false;
  implementsAi: false;
  implementsClassification: false;
  implementsXml: false;
  implementsTiss: false;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type OCRRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  /** OCRProviderPort oficial — process()/health()/capabilities. */
  getOCRProviderPort(): OCRProviderPort;
};

export type GetOCRRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetOCRRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalOCRSession;
  message?: string;
  code?: string;
};

export type ListOCRRuntimeSessionsInput = {
  status?: OCRRuntimeSessionStatus;
  documentId?: string;
  sessionId?: string;
  idPrefix?: string;
  captureRuntimeSessionId?: string;
};

export type ListOCRRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalOCRSession[];
  message?: string;
  code?: string;
};

export type ListOCRProviderReferencesResult = {
  ok: boolean;
  references: readonly CanonicalOCRProviderReference[];
};

/** Alias tipado da coordenação OCR. */
export type CoordinateOCRInput = CanonicalOCRRequest;
export type CoordinateOCRResult = CanonicalOCRResult;

/** Input de execução OCR real via Runtime (OCR-01). */
export type ProcessOCRInput = OCRProcessInput & {
  /** Metadados opcionais para sessão canônica. */
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
  correlationId?: string;
  captureRuntimeSessionId?: string;
  preferredProviderReference?: CanonicalOCRProviderReferenceId;
};

export type ProcessOCRResult = CanonicalOCRResult;

/** Opções de resolução do OCRRuntimePort. */
export type OCRRuntimeProviderOptions = {
  provider?: OCRRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: OCRRuntimeEnterpriseDeps;
};

/** Catálogo de providers referenciados pelo Runtime (HTTP só no Adapter). */
export const STRUCTURAL_OCR_PROVIDER_REFERENCES: readonly CanonicalOCRProviderReference[] = [
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "azure",
    displayName: "Azure Document Intelligence",
    vendor: "Microsoft",
    status: "available-via-ocr-provider-port",
    implementsRealOcr: true,
    connected: false,
  },
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "google-vision",
    displayName: "Google Cloud Vision / Document AI",
    vendor: "Google",
    status: "structural-reference-only",
    implementsRealOcr: false,
    connected: false,
  },
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "aws-textract",
    displayName: "AWS Textract",
    vendor: "Amazon",
    status: "structural-reference-only",
    implementsRealOcr: false,
    connected: false,
  },
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "tesseract",
    displayName: "Tesseract OCR",
    vendor: "Open Source",
    status: "structural-reference-only",
    implementsRealOcr: false,
    connected: false,
  },
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "mock",
    displayName: "Mock OCR Provider (EPC-15)",
    vendor: "MedicFlow Enterprise",
    status: "structural-reference-only",
    implementsRealOcr: false,
    connected: false,
  },
] as const;

export function resolveStructuralProviderReference(
  id?: CanonicalOCRProviderReferenceId,
): CanonicalOCRProviderReference {
  const found = STRUCTURAL_OCR_PROVIDER_REFERENCES.find((ref) => ref.providerReferenceId === id);
  return (
    found ?? STRUCTURAL_OCR_PROVIDER_REFERENCES.find((ref) => ref.providerReferenceId === "mock")!
  );
}
