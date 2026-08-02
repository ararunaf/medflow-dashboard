/**
 * Tipos vendor-agnósticos do Document Classification Runtime — DIP-04.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Classification Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * Este componente NÃO executa classificação. NÃO usa IA/LLM/ML/embeddings.
 * NÃO usa OCR para classificação. NÃO aplica regras ou heurísticas.
 * Coordena estruturalmente via Ports oficiais.
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
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
  realClassificationAvailable: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Capacidades tecnológicas de classificação permanecem FALSE — nenhuma é executada.
 */
export type DocumentClassificationRuntimeCapabilities = {
  provider: DocumentClassificationRuntimeProviderId;
  adapterId: string;
  supportsCoordinateClassification: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesOCRRuntime: boolean;
  usesCaptureEngineRuntime: boolean;
  /** Capacidades tecnológicas — informativas / FALSE (DIP-04). */
  supportsMedicalGuideClassification: false;
  supportsInvoiceClassification: false;
  supportsContractClassification: false;
  supportsBatchClassification: false;
  supportsConfidenceScore: false;
  supportsMultiLabelClassification: false;
  supportsCustomModels: false;
  supportsRuleBasedClassification: false;
  implementsRealClassification: false;
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
   * OCR Runtime (DIP-03) — hop anterior na cadeia estrutural.
   * NUNCA invocar OCR real; apenas health / sessão estrutural.
   */
  getOCRRuntimePort(): OCRRuntimePort;
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

/** Alias tipado da operação principal (coordenação estrutural — sem classificação real). */
export type CoordinateClassificationInput = CanonicalDocumentClassificationRequest;
export type CoordinateClassificationResult = CanonicalDocumentClassificationResult;

/** Opções de resolução do DocumentClassificationRuntimePort. */
export type DocumentClassificationRuntimeProviderOptions = {
  provider?: DocumentClassificationRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;
};

/** Catálogo estrutural de Classification Providers futuros (sem conexão). */
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
      vendor: "Future Rule Engine",
      status: "structural-reference-only",
      implementsRealClassification: false,
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
