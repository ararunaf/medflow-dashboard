/**
 * Tipos vendor-agnósticos do OCR Runtime — DIP-03.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCRRuntimePort → Canonical Execution Orchestrator
 *     → OCR Provider Adapter → Provider futuro
 *
 * Este componente NÃO executa OCR. NÃO extrai texto. NÃO conecta providers.
 * Coordena estruturalmente via Ports oficiais.
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { OCRProviderPort } from "../../ocr-provider/ports/ocr-provider-port";
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
  realOcrAvailable: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Capacidades tecnológicas OCR permanecem FALSE — nenhuma é executada.
 */
export type OCRRuntimeCapabilities = {
  provider: OCRRuntimeProviderId;
  adapterId: string;
  supportsCoordinateOcr: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesOCRProviderAdapter: boolean;
  usesCaptureEngineRuntime: boolean;
  /** Capacidades tecnológicas — informativas / FALSE (DIP-03). */
  supportsPdf: false;
  supportsImage: false;
  supportsBatch: false;
  supportsStreaming: false;
  supportsHandwriting: false;
  supportsTables: false;
  supportsForms: false;
  supportsConfidenceScore: false;
  implementsRealOcr: false;
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
  /**
   * Adapter estrutural EPC-15 — health/capabilities/providerInfo apenas.
   * NUNCA invocar extração real no Provider Adapter nesta sprint.
   */
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

/** Alias tipado da operação principal (coordenação estrutural — sem OCR real). */
export type CoordinateOCRInput = CanonicalOCRRequest;
export type CoordinateOCRResult = CanonicalOCRResult;

/** Opções de resolução do OCRRuntimePort. */
export type OCRRuntimeProviderOptions = {
  provider?: OCRRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: OCRRuntimeEnterpriseDeps;
};

/** Catálogo estrutural de providers futuros (sem conexão). */
export const STRUCTURAL_OCR_PROVIDER_REFERENCES: readonly CanonicalOCRProviderReference[] = [
  {
    kind: "canonical-ocr-provider-reference",
    providerReferenceId: "azure",
    displayName: "Azure Document Intelligence",
    vendor: "Microsoft",
    status: "structural-reference-only",
    implementsRealOcr: false,
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
