/**
 * Tipos vendor-agnósticos do Document Classification Runtime — DIP-04 / CLASS-01.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → DocumentClassificationProviderPort
 *     → DefaultDocumentClassificationAdapter → Classification Provider
 *
 * Este componente NÃO usa IA/LLM/ML/embeddings.
 * Classificação real exclusivamente via DocumentClassificationProviderPort.
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { DocumentClassificationProviderPort } from "../../document-classification-provider/ports/document-classification-provider-port";
import type { DocumentClassificationProcessInput } from "../../document-classification-provider/ports/types";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type {
  CanonicalDocumentClassificationProviderReference,
  CanonicalDocumentClassificationProviderReferenceId,
  CanonicalDocumentClassificationRequest,
  CanonicalDocumentClassificationResult,
  CanonicalDocumentClassificationSession,
  DocumentClassificationRuntimeSessionStatus,
} from "./models";

export type {
  CanonicalDocumentClassificationCapabilities,
  CanonicalDocumentClassificationConfiguration,
  CanonicalDocumentClassificationIdentity,
  CanonicalDocumentClassificationMetadata,
  CanonicalDocumentClassificationProviderReference,
  CanonicalDocumentClassificationProviderReferenceId,
  CanonicalDocumentClassificationReference,
  CanonicalDocumentClassificationRequest,
  CanonicalDocumentClassificationResult,
  CanonicalDocumentClassificationSession,
  CanonicalDocumentClassificationTelemetry,
  CanonicalDocumentClassificationType,
  DocumentClassificationRuntimeSessionStatus,
} from "./models";

/** Provedores / mecanismos do Document Classification Runtime (adapters do Port). */
export type DocumentClassificationRuntimeProviderId = "default" | "mock" | "test";

/** Resultado de health check. */
export type DocumentClassificationRuntimeHealth = {
  ok: boolean;
  provider: DocumentClassificationRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  enterpriseOrchestratorOk?: boolean;
  ocrRuntimeOk?: boolean;
  classificationProviderAdapterOk?: boolean;
  /** true quando DocumentClassificationProviderPort pode executar classificação. */
  realClassificationAvailable: boolean;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Runtime permanece desacoplado de vendors — regras só no Provider Adapter.
 */
export type DocumentClassificationRuntimeCapabilities = {
  provider: DocumentClassificationRuntimeProviderId;
  adapterId: string;
  supportsCoordinateClassification: boolean;
  supportsClassify: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesOCRRuntime: boolean;
  usesCaptureEngineRuntime: boolean;
  usesDocumentClassificationProviderAdapter: boolean;
  supportsMedicalGuideClassification: boolean;
  supportsInvoiceClassification: boolean;
  supportsContractClassification: boolean;
  supportsBatchClassification: boolean;
  supportsConfidenceScore: boolean;
  supportsMultiLabelClassification: boolean;
  supportsCustomModels: boolean;
  supportsRuleBasedClassification: boolean;
  /** Runtime pode acionar classificação real via ProviderPort.classify(). */
  implementsRealClassification: boolean;
  implementsAi: false;
  implementsMachineLearning: false;
  implementsRuleEngine: false;
  implementsEmbeddings: false;
  implementsLlm: false;
  implementsOcrForClassification: false;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type DocumentClassificationRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  /**
   * OCR Runtime (DIP-03) — hop anterior na cadeia.
   * classify() consome texto/estrutura do OCR; nunca chama OCR HTTP.
   */
  getOCRRuntimePort(): OCRRuntimePort;
  /** DocumentClassificationProviderPort oficial — classify()/health()/capabilities. */
  getDocumentClassificationProviderPort(): DocumentClassificationProviderPort;
};

export type GetDocumentClassificationRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetDocumentClassificationRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalDocumentClassificationSession;
  message?: string;
  code?: string;
};

export type ListDocumentClassificationRuntimeSessionsInput = {
  status?: DocumentClassificationRuntimeSessionStatus;
  documentId?: string;
  sessionId?: string;
  idPrefix?: string;
  captureRuntimeSessionId?: string;
  ocrRuntimeSessionId?: string;
};

export type ListDocumentClassificationRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalDocumentClassificationSession[];
  message?: string;
  code?: string;
};

export type ListDocumentClassificationProviderReferencesResult = {
  ok: boolean;
  references: readonly CanonicalDocumentClassificationProviderReference[];
};

/** Alias tipado da coordenação (sem classificação real). */
export type CoordinateClassificationInput = CanonicalDocumentClassificationRequest;
export type CoordinateClassificationResult = CanonicalDocumentClassificationResult;

/** Input de execução de classificação real via Runtime (CLASS-01). */
export type ClassifyDocumentInput = DocumentClassificationProcessInput & {
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
  correlationId?: string;
  captureRuntimeSessionId?: string;
  ocrRuntimeSessionId?: string;
  preferredProviderReference?: CanonicalDocumentClassificationProviderReferenceId;
};

export type ClassifyDocumentResult = CanonicalDocumentClassificationResult;

/** Opções de resolução do DocumentClassificationRuntimePort. */
export type DocumentClassificationRuntimeProviderOptions = {
  provider?: DocumentClassificationRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;
};

/** Catálogo de Classification Providers referenciados pelo Runtime. */
export const STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES: readonly CanonicalDocumentClassificationProviderReference[] =
  [
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "ai-classifier",
      displayName: "AI Classifier",
      vendor: "Future AI Provider",
      status: "structural-reference-only",
      implementsRealClassification: false,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "rule-based-classifier",
      displayName: "Rule Based Classifier",
      vendor: "MedicFlow Enterprise",
      status: "available-via-document-classification-provider-port",
      implementsRealClassification: true,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "ml-classifier",
      displayName: "ML Classifier",
      vendor: "Future ML Provider",
      status: "structural-reference-only",
      implementsRealClassification: false,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "hybrid-classifier",
      displayName: "Hybrid Classifier",
      vendor: "Future Hybrid Provider",
      status: "structural-reference-only",
      implementsRealClassification: false,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
    {
      kind: "canonical-document-classification-provider-reference",
      providerReferenceId: "mock",
      displayName: "Mock Classifier",
      vendor: "MedicFlow Enterprise",
      status: "structural-reference-only",
      implementsRealClassification: false,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      connected: false,
    },
  ] as const;

export function resolveStructuralClassificationProviderReference(
  id?: CanonicalDocumentClassificationProviderReferenceId,
): CanonicalDocumentClassificationProviderReference {
  const found = STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES.find(
    (ref) => ref.providerReferenceId === id,
  );
  return (
    found ??
    STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES.find(
      (ref) => ref.providerReferenceId === "mock",
    )!
  );
}
