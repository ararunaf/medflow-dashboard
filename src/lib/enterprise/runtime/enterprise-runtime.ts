/**
 * DefaultEnterpriseRuntime — composição oficial da Foundation
 * (ARCH-01 / DIP-01…DIP-06 / ARCH-02 DIP-07).
 *
 * Ponto único de acesso do produto aos Ports Enterprise.
 * Bridge Captura → CaptureEngineRuntimePort → Orchestrator → DocumentIntakeRuntime
 *   → DocumentIntakePort → Adapter → Implementação existente
 *   → OCRRuntimePort (F3-CAP-05) → Orchestrator → OCRProviderPort → Azure Adapter (OCR-01)
 *   → DocumentClassificationRuntimePort (F3-CAP-06) → Orchestrator
 *   → DocumentClassificationProviderPort → DefaultDocumentClassificationAdapter (CLASS-01)
 *   → DocumentExtractionRuntimePort (F3-CAP-07) — structural foundation only
 *   → ValidationRuntimePort (F3-CAP-08) — structural foundation only
 *   → AIOrchestrationRuntimePort (F3-CAP-09) — structural foundation only
 *   → AuditRuntimePort (F3-CAP-10) — structural foundation only
 *   → TISSMappingRuntimePort (F3-CAP-11) — structural foundation only
 *   → AutoFillRuntimePort (F3-CAP-12) — structural foundation only
 *   → QualityRuntimePort (F3-CAP-13) — structural foundation only
 *   → XMLTISSRuntimePort (C-01) — structural foundation only
 *   → XMLValidationRuntimePort (C-02) — structural foundation only
 *   → SOAPRuntimePort (C-03) — structural transport encapsulator only
 *   → OperatorRuntimePort (C-04) — structural OperatorCapabilityProfile foundation only
 *   → AuthorizationRuntimePort (C-05) — structural AuthorizationStrategy / AuthorizationPolicy foundation only
 *   → BatchRuntimePort (C-06) — structural BatchManifest / BatchStateMachine foundation only
 *   → ProtocolRuntimePort (C-07) — structural ProtocolProfile / ProtocolResolver foundation only
 *   → ReturnRuntimePort (C-08) — structural ReturnManifest / ReturnCorrelation / ReturnStateMachine foundation only
 *   → StorageManagerRuntimePort → Orchestrator
 *   → StorageProviderPort → DefaultStorageProviderAdapter (STORAGE-01)
 *   → DocumentSearchRuntimePort → Orchestrator
 *   → SearchProviderPort → DefaultSearchProviderAdapter (SEARCH-01)
 *   → TISSRuntimePort → TISSCatalogPort → Catalog Adapter → Store (TISS-02)
 *   → TISSRuntimePort → RulePackEnginePort → Rule Pack Adapter → Store (TISS-03)
 *   → TISSRuntimePort → XMLRuntimePort → XMLGenerationRuntimePort → XMLSerializerRuntimePort → XMLSchemaRuntimePort → XMLValidationRuntimePort → XSDRuntimePort → NamespaceRuntimePort → Store (TISS-04…TISS-10)
 *   → TISSRuntimePort → Orchestrator → TISSProviderPort → DefaultTISSProviderAdapter (TISS-01)
 *   → AIProviderRuntimePort → Orchestrator → AIProviderPort → Adapter → OpenAI.
 * OCR: exclusivamente via OCR Runtime → OCRProviderPort (OCR-01) — sem bypass HTTP Azure.
 * Storage: exclusivamente via Storage Manager Runtime → StorageProviderPort (STORAGE-01).
 * Search: exclusivamente via Document Search Runtime → SearchProviderPort (SEARCH-01).
 * TISS: exclusivamente via TISS Runtime → TISSCatalogPort + RulePackEnginePort + XMLRuntimePort + XMLGenerationRuntimePort + XMLSerializerRuntimePort + XMLSchemaRuntimePort + XMLValidationRuntimePort + XSDRuntimePort + NamespaceRuntimePort + TISSProviderPort — sem XML TISS/ANS real/operadoras.
 * IA: exclusivamente via AI Provider Runtime (ARCH-02) — sem bypass HTTP.
 */
import { createAIProviderPort } from "../ai-provider/providers/create-ai-provider-port";
import type { AIProviderPort } from "../ai-provider/ports/ai-provider-port";
import { createAIProviderRuntimePort } from "../ai-provider-runtime/providers/create-ai-provider-runtime-port";
import type { AIProviderRuntimePort } from "../ai-provider-runtime/ports/ai-provider-runtime-port";
import { createCanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/providers/create-canonical-execution-orchestrator-port";
import type { CanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import { createCaptureEngineRuntimePort } from "../capture-engine-runtime/providers/create-capture-engine-runtime-port";
import type { CaptureEngineRuntimePort } from "../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { CanonicalCaptureRequest } from "../capture-engine-runtime/ports/models";
import { createDocumentClassificationProviderPort } from "../document-classification-provider/providers/create-document-classification-provider-port";
import type { DocumentClassificationProviderPort } from "../document-classification-provider/ports/document-classification-provider-port";
import { createDocumentClassificationRuntimePort } from "../document-classification-runtime/providers/create-document-classification-runtime-port";
import type { DocumentClassificationRuntimePort } from "../document-classification-runtime/ports/document-classification-runtime-port";
import { createDocumentExtractionRuntimePort } from "../document-extraction-runtime/providers/create-document-extraction-runtime-port";
import type { DocumentExtractionRuntimePort } from "../document-extraction-runtime/ports/document-extraction-runtime-port";
import { createValidationRuntimePort } from "../validation-runtime/providers/create-validation-runtime-port";
import type { ValidationRuntimePort } from "../validation-runtime/ports/validation-runtime-port";
import { createAIOrchestrationRuntimePort } from "../ai-orchestration-runtime/providers/create-ai-orchestration-runtime-port";
import type { AIOrchestrationRuntimePort } from "../ai-orchestration-runtime/ports/ai-orchestration-runtime-port";
import { createAuditRuntimePort } from "../audit-runtime/providers/create-audit-runtime-port";
import type { AuditRuntimePort } from "../audit-runtime/ports/audit-runtime-port";
import { createTISSMappingRuntimePort } from "../tiss-mapping-runtime/providers/create-tiss-mapping-runtime-port";
import type { TISSMappingRuntimePort } from "../tiss-mapping-runtime/ports/tiss-mapping-runtime-port";
import { createAutoFillRuntimePort } from "../auto-fill-runtime/providers/create-auto-fill-runtime-port";
import type { AutoFillRuntimePort } from "../auto-fill-runtime/ports/auto-fill-runtime-port";
import { createQualityRuntimePort } from "../quality-runtime/providers/create-quality-runtime-port";
import type { QualityRuntimePort } from "../quality-runtime/ports/quality-runtime-port";
import { createXMLTISSRuntimePort } from "../xml-tiss-runtime/providers/create-xml-tiss-runtime-port";
import type { XMLTISSRuntimePort } from "../xml-tiss-runtime/ports/xml-tiss-runtime-port";
import { createDocumentIntakePort } from "../document-intake/providers/create-document-intake-port";
import type { DocumentIntakePort } from "../document-intake/ports/document-intake-port";
import { createDocumentIntakeRuntimePort } from "../document-intake-runtime/providers/create-document-intake-runtime-port";
import type { DocumentIntakeRuntimePort } from "../document-intake-runtime/ports/document-intake-runtime-port";
import { createDocumentSearchRuntimePort } from "../document-search-runtime/providers/create-document-search-runtime-port";
import type { DocumentSearchRuntimePort } from "../document-search-runtime/ports/document-search-runtime-port";
import { createSearchProviderPort } from "../search-provider/providers/create-search-provider-port";
import type { SearchProviderPort } from "../search-provider/ports/search-provider-port";
import { createOCRProviderPort } from "../ocr-provider/providers/create-ocr-provider-port";
import type { OCRProviderPort } from "../ocr-provider/ports/ocr-provider-port";
import { createOCRRuntimePort } from "../ocr-runtime/providers/create-ocr-runtime-port";
import type { OCRRuntimePort } from "../ocr-runtime/ports/ocr-runtime-port";
import { createStorageManagerRuntimePort } from "../storage-manager-runtime/providers/create-storage-manager-runtime-port";
import type { StorageManagerRuntimePort } from "../storage-manager-runtime/ports/storage-manager-runtime-port";
import { createStorageProviderPort } from "../storage-provider/providers/create-storage-provider-port";
import type { StorageProviderPort } from "../storage-provider/ports/storage-provider-port";
import { createRulePackEnginePort } from "../rule-pack-engine/providers/create-rule-pack-engine-port";
import type { RulePackEnginePort } from "../rule-pack-engine/ports/rule-pack-engine-port";
import { createTISSCatalogPort } from "../tiss-catalog/providers/create-tiss-catalog-port";
import type { TISSCatalogPort } from "../tiss-catalog/ports/tiss-catalog-port";
import { createTISSProviderPort } from "../tiss-provider/providers/create-tiss-provider-port";
import type { TISSProviderPort } from "../tiss-provider/ports/tiss-provider-port";
import { createTISSRuntimePort } from "../tiss-runtime/providers/create-tiss-runtime-port";
import type { TISSRuntimePort } from "../tiss-runtime/ports/tiss-runtime-port";
import { createXMLGenerationRuntimePort } from "../xml-generation-runtime/providers/create-xml-generation-runtime-port";
import type { XMLGenerationRuntimePort } from "../xml-generation-runtime/ports/xml-generation-runtime-port";
import { createXMLRuntimePort } from "../xml-runtime/providers/create-xml-runtime-port";
import type { XMLRuntimePort } from "../xml-runtime/ports/xml-runtime-port";
import { createXMLSchemaRuntimePort } from "../xml-schema-runtime/providers/create-xml-schema-runtime-port";
import type { XMLSchemaRuntimePort } from "../xml-schema-runtime/ports/xml-schema-runtime-port";
import { createXMLSerializerRuntimePort } from "../xml-serializer-runtime/providers/create-xml-serializer-runtime-port";
import type { XMLSerializerRuntimePort } from "../xml-serializer-runtime/ports/xml-serializer-runtime-port";
import { createXMLValidationRuntimePort } from "../xml-validation-runtime/providers/create-xml-validation-runtime-port";
import type { XMLValidationRuntimePort } from "../xml-validation-runtime/ports/xml-validation-runtime-port";
import { createSOAPRuntimePort } from "../soap-runtime/providers/create-soap-runtime-port";
import type { SOAPRuntimePort } from "../soap-runtime/ports/soap-runtime-port";
import { createOperatorRuntimePort } from "../operator-runtime/providers/create-operator-runtime-port";
import type { OperatorRuntimePort } from "../operator-runtime/ports/operator-runtime-port";
import { createAuthorizationRuntimePort } from "../authorization-runtime/providers/create-authorization-runtime-port";
import type { AuthorizationRuntimePort } from "../authorization-runtime/ports/authorization-runtime-port";
import { createBatchRuntimePort } from "../batch-runtime/providers/create-batch-runtime-port";
import type { BatchRuntimePort } from "../batch-runtime/ports/batch-runtime-port";
import { createProtocolRuntimePort } from "../protocol-runtime/providers/create-protocol-runtime-port";
import type { ProtocolRuntimePort } from "../protocol-runtime/ports/protocol-runtime-port";
import { createReturnRuntimePort } from "../return-runtime/providers/create-return-runtime-port";
import type { ReturnRuntimePort } from "../return-runtime/ports/return-runtime-port";
import { createXSDRuntimePort } from "../xsd-runtime/providers/create-xsd-runtime-port";
import type { XSDRuntimePort } from "../xsd-runtime/ports/xsd-runtime-port";
import { createNamespaceRuntimePort } from "../namespace-runtime/providers/create-namespace-runtime-port";
import type { NamespaceRuntimePort } from "../namespace-runtime/ports/namespace-runtime-port";
import { createQueueRuntimePort } from "../queue-runtime/providers/create-queue-runtime-port";
import type { QueueRuntimePort } from "../queue-runtime/ports/queue-runtime-port";
import { createPersistentQueueRuntimePort } from "../persistent-queue-runtime/providers/create-persistent-queue-runtime-port";
import type { PersistentQueueRuntimePort } from "../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import { createObservabilityRuntimePort } from "../observability-runtime/providers/create-observability-runtime-port";
import type { ObservabilityRuntimePort } from "../observability-runtime/ports/observability-runtime-port";
import { createScalabilityRuntimePort } from "../scalability-runtime/providers/create-scalability-runtime-port";
import type { ScalabilityRuntimePort } from "../scalability-runtime/ports/scalability-runtime-port";
import { createSchedulerRuntimePort } from "../scheduler-runtime/providers/create-scheduler-runtime-port";
import type { SchedulerRuntimePort } from "../scheduler-runtime/ports/scheduler-runtime-port";
import { createWorkerRuntimePort } from "../worker-runtime/providers/create-worker-runtime-port";
import type { WorkerRuntimePort } from "../worker-runtime/ports/worker-runtime-port";
import { createScannerRuntimePort } from "../scanner-runtime/providers/create-scanner-runtime-port";
import type { ScannerRuntimePort } from "../scanner-runtime/ports/scanner-runtime-port";
import { createWatchFolderRuntimePort } from "../watch-folder-runtime/providers/create-watch-folder-runtime-port";
import type { WatchFolderRuntimePort } from "../watch-folder-runtime/ports/watch-folder-runtime-port";
import { createUploadRuntimePort } from "../upload-runtime/providers/create-upload-runtime-port";
import type { UploadRuntimePort } from "../upload-runtime/ports/upload-runtime-port";
import { createIntelligentCaptureRuntimePort } from "../intelligent-capture-runtime/providers/create-intelligent-capture-runtime-port";
import type { IntelligentCaptureRuntimePort } from "../intelligent-capture-runtime/ports/intelligent-capture-runtime-port";
import type {
  EnterpriseRuntime,
  EnterpriseRuntimeHealth,
  EnterpriseRuntimeOptions,
  RegisterCaptureDocumentIntakeInput,
  RegisterCaptureDocumentIntakeResult,
} from "./types";

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export class DefaultEnterpriseRuntime implements EnterpriseRuntime {
  readonly runtimeId;
  private readonly documentIntakePort: DocumentIntakePort;
  private readonly orchestratorPort: CanonicalExecutionOrchestratorPort;
  private readonly documentIntakeRuntimePort: DocumentIntakeRuntimePort;
  private readonly ocrProviderPort: OCRProviderPort;
  private readonly ocrRuntimePort: OCRRuntimePort;
  private readonly documentClassificationProviderPort: DocumentClassificationProviderPort;
  private readonly documentClassificationRuntimePort: DocumentClassificationRuntimePort;
  private readonly documentExtractionRuntimePort: DocumentExtractionRuntimePort;
  private readonly validationRuntimePort: ValidationRuntimePort;
  private readonly aiOrchestrationRuntimePort: AIOrchestrationRuntimePort;
  private readonly auditRuntimePort: AuditRuntimePort;
  private readonly tissMappingRuntimePort: TISSMappingRuntimePort;
  private readonly autoFillRuntimePort: AutoFillRuntimePort;
  private readonly qualityRuntimePort: QualityRuntimePort;
  private readonly xmlTissRuntimePort: XMLTISSRuntimePort;
  private readonly storageProviderPort: StorageProviderPort;
  private readonly storageManagerRuntimePort: StorageManagerRuntimePort;
  private readonly searchProviderPort: SearchProviderPort;
  private readonly documentSearchRuntimePort: DocumentSearchRuntimePort;
  private readonly tissProviderPort: TISSProviderPort;
  private readonly tissCatalogPort: TISSCatalogPort;
  private readonly rulePackEnginePort: RulePackEnginePort;
  private readonly xmlGenerationRuntimePort: XMLGenerationRuntimePort;
  private readonly xmlRuntimePort: XMLRuntimePort;
  private readonly xmlSerializerRuntimePort: XMLSerializerRuntimePort;
  private readonly xmlSchemaRuntimePort: XMLSchemaRuntimePort;
  private readonly xmlValidationRuntimePort: XMLValidationRuntimePort;
  private readonly soapRuntimePort: SOAPRuntimePort;
  private readonly operatorRuntimePort: OperatorRuntimePort;
  private readonly authorizationRuntimePort: AuthorizationRuntimePort;
  private readonly batchRuntimePort: BatchRuntimePort;
  private readonly protocolRuntimePort: ProtocolRuntimePort;
  private readonly returnRuntimePort: ReturnRuntimePort;
  private readonly xsdRuntimePort: XSDRuntimePort;
  private readonly namespaceRuntimePort: NamespaceRuntimePort;
  private readonly queueRuntimePort: QueueRuntimePort;
  /** Atribuído após Queue; lazy getter do Queue pode referenciar antes da atribuição. */
  private readonly workerRuntimePort!: WorkerRuntimePort;
  /** Atribuído após Queue/Worker; lazy getters podem referenciar antes da atribuição. */
  private readonly schedulerRuntimePort!: SchedulerRuntimePort;
  /** Atribuído após Queue/Worker/Scheduler; lazy getters podem referenciar antes da atribuição. */
  private readonly persistentQueueRuntimePort!: PersistentQueueRuntimePort;
  /** Atribuído após PQR; lazy getters de Q/W/S/PQR/TISS podem referenciar antes da atribuição. */
  private readonly observabilityRuntimePort!: ObservabilityRuntimePort;
  /** Atribuído após Observability; lazy getters de Q/W/S/PQR/Obs/TISS podem referenciar antes da atribuição. */
  private readonly scalabilityRuntimePort!: ScalabilityRuntimePort;
  /** Atribuído após Scalability; lazy getters de Obs/Scal podem referenciar antes da atribuição. */
  private readonly tissRuntimePort!: TISSRuntimePort;
  /** Atribuído após TISS + Capture/OCR/Queue/Worker/Scheduler/PQR/Obs/Scal — deps estruturais. */
  private readonly scannerRuntimePort!: ScannerRuntimePort;
  /** Atribuído após Scanner + Capture/OCR/PQR/Scheduler/Worker/Obs — deps estruturais. */
  private readonly watchFolderRuntimePort!: WatchFolderRuntimePort;
  /** Atribuído após WatchFolder + Scanner/Capture/OCR/PQR/Scheduler/Worker/Obs — deps estruturais. */
  private readonly uploadRuntimePort!: UploadRuntimePort;
  /** Atribuído após Upload + Scanner/WatchFolder/OCR/PQR/Scheduler/Worker/Obs — deps estruturais. */
  private readonly intelligentCaptureRuntimePort!: IntelligentCaptureRuntimePort;
  private readonly captureEngineRuntimePort: CaptureEngineRuntimePort;
  private readonly aiProviderPort: AIProviderPort;
  private readonly aiProviderRuntimePort: AIProviderRuntimePort;

  constructor(options: EnterpriseRuntimeOptions = {}) {
    this.runtimeId = options.runtimeId ?? "default";
    this.documentIntakePort =
      options.documentIntakePort ?? createDocumentIntakePort({ provider: "default" });
    this.orchestratorPort =
      options.orchestratorPort ?? createCanonicalExecutionOrchestratorPort({ provider: "default" });
    this.documentIntakeRuntimePort =
      options.documentIntakeRuntimePort ??
      createDocumentIntakeRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getDocumentIntakePort: () => this.documentIntakePort,
          getOrchestratorPort: () => this.orchestratorPort,
        },
      });
    // OCR-01: Azure Document Intelligence oficial atrás do OCRProviderPort — sem bypass no produto.
    this.ocrProviderPort = options.ocrProviderPort ?? createOCRProviderPort({ provider: "azure" });
    // F3-CAP-05: Enterprise OCR Runtime Foundation — orquestração estrutural de
    // jobs/requests/documentos OCR, com coordenação/execução real DIP-03/OCR-01
    // preservada via Orchestrator + OCRProviderPort. Peers estruturais
    // (IntelligentCapture/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/
    // Observability/Scalability) via lazy getters — OCR é construído antes
    // desses Ports no composition root, sem consumo funcional (shape-check
    // apenas em health()).
    this.ocrRuntimePort =
      options.ocrRuntimePort ??
      createOCRRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getOCRProviderPort: () => this.ocrProviderPort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    // CLASS-01: Rule-based Document Classification oficial atrás do ProviderPort — sem IA / sem bypass.
    this.documentClassificationProviderPort =
      options.documentClassificationProviderPort ??
      createDocumentClassificationProviderPort({ provider: "rule-based" });
    // F3-CAP-06: Enterprise Document Classification Runtime Foundation — orquestração
    // estrutural de jobs/requests/documentos de classificação, com coordenação/execução
    // real DIP-04/CLASS-01 preservada via Orchestrator + OCR Runtime +
    // DocumentClassificationProviderPort. Peers estruturais (IntelligentCapture/Scanner/
    // WatchFolder/Upload/PQR/Worker/Scheduler/Observability/Scalability) via lazy
    // getters — Classification Runtime é construído antes desses Ports no composition
    // root, sem consumo funcional (shape-check apenas em health()).
    this.documentClassificationRuntimePort =
      options.documentClassificationRuntimePort ??
      createDocumentClassificationRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getDocumentClassificationProviderPort: () => this.documentClassificationProviderPort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    // F3-CAP-07: Enterprise Document Extraction Runtime Foundation — orquestração
    // estrutural de jobs/requests/documentos de extração. Sem extração real /
    // OCR / IA / ML / LLM / Regex / Template Matching / leitura de campos /
    // preenchimento de guias. Peers estruturais (DocumentClassification/OCR/
    // IntelligentCapture/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/
    // Observability/Scalability) via lazy getters — shape-check apenas em health().
    this.documentExtractionRuntimePort =
      options.documentExtractionRuntimePort ??
      createDocumentExtractionRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    // F3-CAP-08: Enterprise Validation Runtime Foundation — orquestração
    // estrutural de jobs/requests/documentos de validação. Sem validação real /
    // auditoria / IA / ML / LLM / correção automática / regras TISS /
    // regras de operadoras / aprovação ou rejeição automática. Peers
    // estruturais (DocumentExtraction/DocumentClassification/OCR/
    // IntelligentCapture/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/
    // Observability/Scalability) via lazy getters — shape-check apenas em health().
    this.validationRuntimePort =
      options.validationRuntimePort ??
      createValidationRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getDocumentExtractionRuntimePort: () => this.documentExtractionRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    // F3-CAP-09: Enterprise AI Orchestration Runtime Foundation — orquestração
    // estrutural de jobs/requests/tasks de IA futura. Sem IA real / OpenAI /
    // Azure OpenAI / Gemini / Claude / Ollama / Llama / ML / Prompt Engineering /
    // HTTP / agentes funcionais / workflow / decisão automática. Peers
    // estruturais (Validation/DocumentExtraction/DocumentClassification/OCR/
    // IntelligentCapture/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/
    // Observability/Scalability) via lazy getters — shape-check apenas em health().
    this.aiOrchestrationRuntimePort =
      options.aiOrchestrationRuntimePort ??
      createAIOrchestrationRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getValidationRuntimePort: () => this.validationRuntimePort,
          getDocumentExtractionRuntimePort: () => this.documentExtractionRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    // F3-CAP-10: Enterprise Audit Runtime Foundation — orquestração
    // estrutural de jobs/requests/findings de auditoria futura. Sem auditoria
    // real / IA / OpenAI / Azure OpenAI / Gemini / Claude / ML / regras TISS /
    // regras de operadoras / justificativas automáticas / correções
    // automáticas / aprovação ou rejeição automática. Peers estruturais
    // (AIOrchestration/Validation/DocumentExtraction/DocumentClassification/
    // OCR/IntelligentCapture/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/
    // Observability/Scalability) via lazy getters — shape-check apenas em health().
    this.auditRuntimePort =
      options.auditRuntimePort ??
      createAuditRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getAIOrchestrationRuntimePort: () => this.aiOrchestrationRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
          getDocumentExtractionRuntimePort: () => this.documentExtractionRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    // F3-CAP-11: Enterprise TISS Mapping Runtime Foundation — orquestração
    // estrutural de mapeamento canônico TISS futuro. Sem mapeamento funcional /
    // operadoras / XML / preenchimento automático / IA / banco / persistência /
    // APIs. Peers estruturais (AIOrchestration/Audit/Validation/
    // DocumentExtraction/DocumentClassification/OCR/IntelligentCapture/Scanner/
    // WatchFolder/Upload) via lazy getters — shape-check apenas em health().
    this.tissMappingRuntimePort =
      options.tissMappingRuntimePort ??
      createTISSMappingRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getAIOrchestrationRuntimePort: () => this.aiOrchestrationRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
          getDocumentExtractionRuntimePort: () => this.documentExtractionRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
        },
      });
    // F3-CAP-12: Enterprise Auto-Fill Runtime Foundation — orquestração
    // estrutural de preenchimento canônico futuro de guias TISS. Sem
    // preenchimento automático / geração de XML / escrita em guias /
    // integração com operadoras / IA / banco / persistência / APIs.
    // Peers estruturais (TISSMapping/Audit/Validation/DocumentExtraction/
    // DocumentClassification/OCR/AIOrchestration/IntelligentCapture/Scanner/
    // WatchFolder/Upload) via lazy getters — shape-check apenas em health().
    this.autoFillRuntimePort =
      options.autoFillRuntimePort ??
      createAutoFillRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getTISSMappingRuntimePort: () => this.tissMappingRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
          getDocumentExtractionRuntimePort: () => this.documentExtractionRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getAIOrchestrationRuntimePort: () => this.aiOrchestrationRuntimePort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
        },
      });
    // F3-CAP-13: Enterprise Quality Runtime Foundation — orquestração
    // estrutural de avaliação futura de qualidade do pipeline documental.
    // Sem avaliação automática / score funcional / decisão automática /
    // IA / OCR / auditoria automática / banco / persistência / APIs.
    // Peers estruturais (AutoFill/TISSMapping/Audit/Validation/
    // DocumentExtraction/DocumentClassification/OCR/AIOrchestration/
    // IntelligentCapture/Scanner/WatchFolder/Upload) via lazy getters —
    // shape-check apenas em health().
    this.qualityRuntimePort =
      options.qualityRuntimePort ??
      createQualityRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getAutoFillRuntimePort: () => this.autoFillRuntimePort,
          getTISSMappingRuntimePort: () => this.tissMappingRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
          getDocumentExtractionRuntimePort: () => this.documentExtractionRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getAIOrchestrationRuntimePort: () => this.aiOrchestrationRuntimePort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
        },
      });
    // C-01: Enterprise XML TISS Runtime Foundation — orquestração
    // estrutural de transformação futura Canonical TISS → XML TISS/ANS.
    // Sem geração de XML / serialização / parser / XSD / SOAP /
    // operadoras / banco / persistência / APIs.
    // Peers estruturais (Quality/AutoFill/TISSMapping/Audit/Validation/
    // DocumentExtraction/DocumentClassification/OCR/AIOrchestration/
    // IntelligentCapture/Scanner/WatchFolder/Upload) via lazy getters —
    // shape-check apenas em health().
    this.xmlTissRuntimePort =
      options.xmlTissRuntimePort ??
      createXMLTISSRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getQualityRuntimePort: () => this.qualityRuntimePort,
          getAutoFillRuntimePort: () => this.autoFillRuntimePort,
          getTISSMappingRuntimePort: () => this.tissMappingRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
          getDocumentExtractionRuntimePort: () => this.documentExtractionRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getAIOrchestrationRuntimePort: () => this.aiOrchestrationRuntimePort,
          getIntelligentCaptureRuntimePort: () => this.intelligentCaptureRuntimePort,
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
        },
      });
    // STORAGE-01: Storage Provider oficial atrás do StorageProviderPort — sem bypass no produto.
    this.storageProviderPort =
      options.storageProviderPort ?? createStorageProviderPort({ provider: "supabase" });
    this.storageManagerRuntimePort =
      options.storageManagerRuntimePort ??
      createStorageManagerRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getStorageProviderPort: () => this.storageProviderPort,
        },
      });
    // SEARCH-01: Search Provider oficial atrás do SearchProviderPort — sem bypass no produto.
    this.searchProviderPort =
      options.searchProviderPort ??
      createSearchProviderPort({
        provider: "storage-backed",
        storageProviderPort: this.storageProviderPort,
      });
    this.documentSearchRuntimePort =
      options.documentSearchRuntimePort ??
      createDocumentSearchRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getStorageManagerRuntimePort: () => this.storageManagerRuntimePort,
          getSearchProviderPort: () => this.searchProviderPort,
        },
      });
    this.captureEngineRuntimePort =
      options.captureEngineRuntimePort ??
      createCaptureEngineRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getDocumentIntakeRuntimePort: () => this.documentIntakeRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getStorageManagerRuntimePort: () => this.storageManagerRuntimePort,
          getDocumentSearchRuntimePort: () => this.documentSearchRuntimePort,
        },
      });
    // TISS-01…07: Provider + Catalog + Rule Pack Engine + XML Runtime + Generation + Serializer + Schema — sem XML TISS/ANS real/operadoras.
    this.tissProviderPort =
      options.tissProviderPort ?? createTISSProviderPort({ provider: "enterprise" });
    this.tissCatalogPort =
      options.tissCatalogPort ?? createTISSCatalogPort({ provider: "enterprise" });
    this.rulePackEnginePort =
      options.rulePackEnginePort ??
      createRulePackEnginePort({
        provider: "enterprise",
        enterpriseDeps: {
          getTISSCatalogPort: () => this.tissCatalogPort,
        },
      });
    this.xmlGenerationRuntimePort =
      options.xmlGenerationRuntimePort ??
      createXMLGenerationRuntimePort({ provider: "enterprise" });
    this.xmlRuntimePort =
      options.xmlRuntimePort ??
      createXMLRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getTISSCatalogPort: () => this.tissCatalogPort,
          getRulePackEnginePort: () => this.rulePackEnginePort,
          getXMLGenerationRuntimePort: () => this.xmlGenerationRuntimePort,
        },
      });
    this.xmlSerializerRuntimePort =
      options.xmlSerializerRuntimePort ??
      createXMLSerializerRuntimePort({ provider: "enterprise" });
    this.xmlSchemaRuntimePort =
      options.xmlSchemaRuntimePort ?? createXMLSchemaRuntimePort({ provider: "enterprise" });
    // C-02: Enterprise XML Validation Runtime Foundation — orquestração
    // estrutural de validação futura de documentos XML.
    // Sem validação XML real / XSD / parser / correção automática / SOAP /
    // operadoras / banco / persistência / APIs / IA.
    // Peers estruturais (XMLTISS/Quality/AutoFill/TISSMapping/Audit/Validation/
    // DocumentExtraction/DocumentClassification/OCR/AIOrchestration) via lazy
    // getters — shape-check apenas em health().
    this.xmlValidationRuntimePort =
      options.xmlValidationRuntimePort ??
      createXMLValidationRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getXMLTISSRuntimePort: () => this.xmlTissRuntimePort,
          getQualityRuntimePort: () => this.qualityRuntimePort,
          getAutoFillRuntimePort: () => this.autoFillRuntimePort,
          getTISSMappingRuntimePort: () => this.tissMappingRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
          getDocumentExtractionRuntimePort: () => this.documentExtractionRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getAIOrchestrationRuntimePort: () => this.aiOrchestrationRuntimePort,
        },
      });
    // C-03: Enterprise SOAP Runtime Foundation — encapsulador estrutural
    // de transporte SOAP futuro.
    // Sem comunicação SOAP / HTTP / WSDL / TLS / certificado / autenticação /
    // MTOM / XML funcional / operadoras / banco / persistência / APIs / filas.
    // Peers estruturais (XMLRuntime/XMLValidationRuntime/Quality/AutoFill/
    // TISSMapping/Audit/Validation) via lazy getters — shape-check apenas
    // em health(). TRANSPORT AGNOSTIC (Regra Permanente nº 5).
    this.soapRuntimePort =
      options.soapRuntimePort ??
      createSOAPRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getXMLRuntimePort: () => this.xmlRuntimePort,
          getXMLValidationRuntimePort: () => this.xmlValidationRuntimePort,
          getQualityRuntimePort: () => this.qualityRuntimePort,
          getAutoFillRuntimePort: () => this.autoFillRuntimePort,
          getTISSMappingRuntimePort: () => this.tissMappingRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
        },
      });
    // C-04: Enterprise Operator Runtime Foundation — Operator Capability Model.
    // Sem operadoras reais / sem lógica condicional por operadora /
    // sem autenticação / sem SOAP/XML/REST funcional / sem banco / sem APIs.
    // Peers estruturais (SOAP/XML/XMLValidation/Quality/AutoFill/TISSMapping/
    // Audit/Validation) via lazy getters — shape-check apenas em health().
    // OPERATOR CAPABILITY MODEL (Regra Permanente nº 7).
    this.operatorRuntimePort =
      options.operatorRuntimePort ??
      createOperatorRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getSOAPRuntimePort: () => this.soapRuntimePort,
          getXMLRuntimePort: () => this.xmlRuntimePort,
          getXMLValidationRuntimePort: () => this.xmlValidationRuntimePort,
          getQualityRuntimePort: () => this.qualityRuntimePort,
          getAutoFillRuntimePort: () => this.autoFillRuntimePort,
          getTISSMappingRuntimePort: () => this.tissMappingRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
        },
      });
    // C-05: Enterprise Authorization Runtime Foundation — Authorization Strategy Pattern.
    // Sem autorização funcional / sem elegibilidade / sem integração com operadoras /
    // sem SOAP/XML/REST funcional / sem autenticação / sem banco / sem APIs.
    // Peers estruturais (Operator/SOAP/XML/XMLValidation/Quality/AutoFill/
    // Audit/Validation) via lazy getters — shape-check apenas em health().
    // AUTHORIZATION STRATEGY PATTERN (Regra Permanente nº 9).
    // POLICY-DRIVEN AUTHORIZATION — OperatorCapabilityProfile + AuthorizationPolicy.
    this.authorizationRuntimePort =
      options.authorizationRuntimePort ??
      createAuthorizationRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getOperatorRuntimePort: () => this.operatorRuntimePort,
          getSOAPRuntimePort: () => this.soapRuntimePort,
          getXMLRuntimePort: () => this.xmlRuntimePort,
          getXMLValidationRuntimePort: () => this.xmlValidationRuntimePort,
          getQualityRuntimePort: () => this.qualityRuntimePort,
          getAutoFillRuntimePort: () => this.autoFillRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
          getValidationRuntimePort: () => this.validationRuntimePort,
        },
      });
    // C-06: Enterprise Batch Runtime Foundation — BatchManifest / BatchStateMachine.
    // Sem processamento em lote / sem filas / sem workers / sem retry funcional /
    // sem scheduler / sem paralelismo / sem SOAP/XML funcional / sem banco / sem APIs.
    // Peers estruturais (Authorization/Operator/SOAP/XML/XMLValidation/Quality/
    // Audit) via lazy getters — shape-check apenas em health().
    // STATE MACHINE FIRST (Regra Permanente nº 11).
    this.batchRuntimePort =
      options.batchRuntimePort ??
      createBatchRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getAuthorizationRuntimePort: () => this.authorizationRuntimePort,
          getOperatorRuntimePort: () => this.operatorRuntimePort,
          getSOAPRuntimePort: () => this.soapRuntimePort,
          getXMLRuntimePort: () => this.xmlRuntimePort,
          getXMLValidationRuntimePort: () => this.xmlValidationRuntimePort,
          getQualityRuntimePort: () => this.qualityRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
        },
      });
    // C-07: Enterprise Protocol Runtime Foundation — ProtocolProfile / ProtocolResolver.
    // Sem SOAP / sem REST / sem gRPC / sem mensageria / sem HTTP / sem TLS /
    // sem autenticação / sem APIs / sem banco / sem resolução funcional.
    // Peers estruturais (Batch/Authorization/Operator/SOAP/XML/XMLValidation)
    // via lazy getters — shape-check apenas em health().
    // PROTOCOL ABSTRACTION (Regra Permanente nº 12).
    this.protocolRuntimePort =
      options.protocolRuntimePort ??
      createProtocolRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getBatchRuntimePort: () => this.batchRuntimePort,
          getAuthorizationRuntimePort: () => this.authorizationRuntimePort,
          getOperatorRuntimePort: () => this.operatorRuntimePort,
          getSOAPRuntimePort: () => this.soapRuntimePort,
          getXMLRuntimePort: () => this.xmlRuntimePort,
          getXMLValidationRuntimePort: () => this.xmlValidationRuntimePort,
        },
      });
    // C-08: Enterprise Return Runtime Foundation — ReturnManifest / ReturnCorrelation /
    // ReturnStateMachine. Sem processamento de retorno / sem correlação automática /
    // sem reconciliação / sem parser XML / sem SOAP / sem operadoras / sem banco /
    // sem workflow. Peers estruturais (Protocol/Batch/Authorization/Operator/SOAP/
    // XML/XMLValidation/Audit) via lazy getters — shape-check apenas em health().
    // CORRELATION BEFORE PROCESSING (Regra Permanente nº 14).
    this.returnRuntimePort =
      options.returnRuntimePort ??
      createReturnRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getProtocolRuntimePort: () => this.protocolRuntimePort,
          getBatchRuntimePort: () => this.batchRuntimePort,
          getAuthorizationRuntimePort: () => this.authorizationRuntimePort,
          getOperatorRuntimePort: () => this.operatorRuntimePort,
          getSOAPRuntimePort: () => this.soapRuntimePort,
          getXMLRuntimePort: () => this.xmlRuntimePort,
          getXMLValidationRuntimePort: () => this.xmlValidationRuntimePort,
          getAuditRuntimePort: () => this.auditRuntimePort,
        },
      });
    this.xsdRuntimePort =
      options.xsdRuntimePort ?? createXSDRuntimePort({ provider: "enterprise" });
    this.namespaceRuntimePort =
      options.namespaceRuntimePort ?? createNamespaceRuntimePort({ provider: "enterprise" });
    // INF-05…INF-10: Queue + Worker + Scheduler + PersistentQueue + Observability + Scalability — deps cruzadas preparadas (lazy getters).
    this.queueRuntimePort =
      options.queueRuntimePort ??
      createQueueRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    this.workerRuntimePort =
      options.workerRuntimePort ??
      createWorkerRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getQueueRuntimePort: () => this.queueRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    this.schedulerRuntimePort =
      options.schedulerRuntimePort ??
      createSchedulerRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getQueueRuntimePort: () => this.queueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    this.persistentQueueRuntimePort =
      options.persistentQueueRuntimePort ??
      createPersistentQueueRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getQueueRuntimePort: () => this.queueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    this.observabilityRuntimePort =
      options.observabilityRuntimePort ??
      createObservabilityRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getQueueRuntimePort: () => this.queueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getTISSRuntimePort: () => this.tissRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    this.scalabilityRuntimePort =
      options.scalabilityRuntimePort ??
      createScalabilityRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getQueueRuntimePort: () => this.queueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getTISSRuntimePort: () => this.tissRuntimePort,
        },
      });
    this.tissRuntimePort =
      options.tissRuntimePort ??
      createTISSRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getTISSProviderPort: () => this.tissProviderPort,
          getTISSCatalogPort: () => this.tissCatalogPort,
          getRulePackEnginePort: () => this.rulePackEnginePort,
          getXMLRuntimePort: () => this.xmlRuntimePort,
          getXMLGenerationRuntimePort: () => this.xmlGenerationRuntimePort,
          getXMLSerializerRuntimePort: () => this.xmlSerializerRuntimePort,
          getXMLSchemaRuntimePort: () => this.xmlSchemaRuntimePort,
          getXMLValidationRuntimePort: () => this.xmlValidationRuntimePort,
          getXSDRuntimePort: () => this.xsdRuntimePort,
          getNamespaceRuntimePort: () => this.namespaceRuntimePort,
          getQueueRuntimePort: () => this.queueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
        },
      });
    // F3-CAP-01: Scanner Runtime Foundation — deps estruturais apenas (sem Scanner real / drivers).
    this.scannerRuntimePort =
      options.scannerRuntimePort ??
      createScannerRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getCaptureEngineRuntimePort: () => this.captureEngineRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getQueueRuntimePort: () => this.queueRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
          getScalabilityRuntimePort: () => this.scalabilityRuntimePort,
          getTISSRuntimePort: () => this.tissRuntimePort,
        },
      });
    // F3-CAP-02: Watch Folder Runtime Foundation — deps estruturais apenas (sem Watch Folder real / watchers).
    this.watchFolderRuntimePort =
      options.watchFolderRuntimePort ??
      createWatchFolderRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getCaptureEngineRuntimePort: () => this.captureEngineRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
        },
      });
    // F3-CAP-03: Upload Runtime Foundation — deps estruturais apenas (sem Upload real / storage providers).
    this.uploadRuntimePort =
      options.uploadRuntimePort ??
      createUploadRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getCaptureEngineRuntimePort: () => this.captureEngineRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
        },
      });
    // F3-CAP-04: Intelligent Capture Runtime Foundation — orquestração estrutural Scanner/WatchFolder/Upload.
    this.intelligentCaptureRuntimePort =
      options.intelligentCaptureRuntimePort ??
      createIntelligentCaptureRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getScannerRuntimePort: () => this.scannerRuntimePort,
          getWatchFolderRuntimePort: () => this.watchFolderRuntimePort,
          getUploadRuntimePort: () => this.uploadRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getPersistentQueueRuntimePort: () => this.persistentQueueRuntimePort,
          getSchedulerRuntimePort: () => this.schedulerRuntimePort,
          getWorkerRuntimePort: () => this.workerRuntimePort,
          getObservabilityRuntimePort: () => this.observabilityRuntimePort,
        },
      });
    // ARCH-02: OpenAI oficial atrás do AIProviderPort — sem bypass no produto.
    this.aiProviderPort = options.aiProviderPort ?? createAIProviderPort({ provider: "openai" });
    this.aiProviderRuntimePort =
      options.aiProviderRuntimePort ??
      createAIProviderRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getAIProviderPort: () => this.aiProviderPort,
        },
      });
  }

  getDocumentIntakePort(): DocumentIntakePort {
    return this.documentIntakePort;
  }

  getOrchestratorPort(): CanonicalExecutionOrchestratorPort {
    return this.orchestratorPort;
  }

  getDocumentIntakeRuntimePort(): DocumentIntakeRuntimePort {
    return this.documentIntakeRuntimePort;
  }

  getCaptureEngineRuntimePort(): CaptureEngineRuntimePort {
    return this.captureEngineRuntimePort;
  }

  getOCRRuntimePort(): OCRRuntimePort {
    return this.ocrRuntimePort;
  }

  getOCRProviderPort(): OCRProviderPort {
    return this.ocrProviderPort;
  }

  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort {
    return this.documentClassificationRuntimePort;
  }

  getDocumentClassificationProviderPort(): DocumentClassificationProviderPort {
    return this.documentClassificationProviderPort;
  }

  getDocumentExtractionRuntimePort(): DocumentExtractionRuntimePort {
    return this.documentExtractionRuntimePort;
  }

  getValidationRuntimePort(): ValidationRuntimePort {
    return this.validationRuntimePort;
  }

  getAIOrchestrationRuntimePort(): AIOrchestrationRuntimePort {
    return this.aiOrchestrationRuntimePort;
  }

  getAuditRuntimePort(): AuditRuntimePort {
    return this.auditRuntimePort;
  }

  getTISSMappingRuntimePort(): TISSMappingRuntimePort {
    return this.tissMappingRuntimePort;
  }

  getAutoFillRuntimePort(): AutoFillRuntimePort {
    return this.autoFillRuntimePort;
  }

  getQualityRuntimePort(): QualityRuntimePort {
    return this.qualityRuntimePort;
  }

  getXMLTISSRuntimePort(): XMLTISSRuntimePort {
    return this.xmlTissRuntimePort;
  }

  getStorageManagerRuntimePort(): StorageManagerRuntimePort {
    return this.storageManagerRuntimePort;
  }

  getStorageProviderPort(): StorageProviderPort {
    return this.storageProviderPort;
  }

  getSearchProviderPort(): SearchProviderPort {
    return this.searchProviderPort;
  }

  getDocumentSearchRuntimePort(): DocumentSearchRuntimePort {
    return this.documentSearchRuntimePort;
  }

  getTISSProviderPort(): TISSProviderPort {
    return this.tissProviderPort;
  }

  getTISSCatalogPort(): TISSCatalogPort {
    return this.tissCatalogPort;
  }

  getRulePackEnginePort(): RulePackEnginePort {
    return this.rulePackEnginePort;
  }

  getXMLRuntimePort(): XMLRuntimePort {
    return this.xmlRuntimePort;
  }

  getXMLGenerationRuntimePort(): XMLGenerationRuntimePort {
    return this.xmlGenerationRuntimePort;
  }

  getXMLSerializerRuntimePort(): XMLSerializerRuntimePort {
    return this.xmlSerializerRuntimePort;
  }

  getXMLSchemaRuntimePort(): XMLSchemaRuntimePort {
    return this.xmlSchemaRuntimePort;
  }

  getXMLValidationRuntimePort(): XMLValidationRuntimePort {
    return this.xmlValidationRuntimePort;
  }

  getSOAPRuntimePort(): SOAPRuntimePort {
    return this.soapRuntimePort;
  }

  getOperatorRuntimePort(): OperatorRuntimePort {
    return this.operatorRuntimePort;
  }

  getAuthorizationRuntimePort(): AuthorizationRuntimePort {
    return this.authorizationRuntimePort;
  }

  getBatchRuntimePort(): BatchRuntimePort {
    return this.batchRuntimePort;
  }

  getProtocolRuntimePort(): ProtocolRuntimePort {
    return this.protocolRuntimePort;
  }

  getReturnRuntimePort(): ReturnRuntimePort {
    return this.returnRuntimePort;
  }

  getXSDRuntimePort(): XSDRuntimePort {
    return this.xsdRuntimePort;
  }

  getNamespaceRuntimePort(): NamespaceRuntimePort {
    return this.namespaceRuntimePort;
  }

  getQueueRuntimePort(): QueueRuntimePort {
    return this.queueRuntimePort;
  }

  getWorkerRuntimePort(): WorkerRuntimePort {
    return this.workerRuntimePort;
  }

  getSchedulerRuntimePort(): SchedulerRuntimePort {
    return this.schedulerRuntimePort;
  }

  getPersistentQueueRuntimePort(): PersistentQueueRuntimePort {
    return this.persistentQueueRuntimePort;
  }

  getObservabilityRuntimePort(): ObservabilityRuntimePort {
    return this.observabilityRuntimePort;
  }

  getScalabilityRuntimePort(): ScalabilityRuntimePort {
    return this.scalabilityRuntimePort;
  }

  getScannerRuntimePort(): ScannerRuntimePort {
    return this.scannerRuntimePort;
  }

  getWatchFolderRuntimePort(): WatchFolderRuntimePort {
    return this.watchFolderRuntimePort;
  }

  getUploadRuntimePort(): UploadRuntimePort {
    return this.uploadRuntimePort;
  }

  getIntelligentCaptureRuntimePort(): IntelligentCaptureRuntimePort {
    return this.intelligentCaptureRuntimePort;
  }

  getTISSRuntimePort(): TISSRuntimePort {
    return this.tissRuntimePort;
  }

  getAIProviderPort(): AIProviderPort {
    return this.aiProviderPort;
  }

  getAIProviderRuntimePort(): AIProviderRuntimePort {
    return this.aiProviderRuntimePort;
  }

  async health(): Promise<EnterpriseRuntimeHealth> {
    const start = nowMs();
    const [
      intakeHealth,
      orchestratorHealth,
      intakeRuntimeHealth,
      captureRuntimeHealth,
      ocrRuntimeHealth,
      ocrProviderHealth,
      classificationProviderHealth,
      classificationRuntimeHealth,
      documentExtractionRuntimeHealth,
      validationRuntimeHealth,
      aiOrchestrationRuntimeHealth,
      auditRuntimeHealth,
      tissMappingRuntimeHealth,
      autoFillRuntimeHealth,
      qualityRuntimeHealth,
      xmlTissRuntimeHealth,
      storageProviderHealth,
      storageManagerRuntimeHealth,
      searchProviderHealth,
      documentSearchRuntimeHealth,
      tissProviderHealth,
      tissCatalogHealth,
      rulePackEngineHealth,
      xmlGenerationRuntimeHealth,
      xmlRuntimeHealth,
      xmlSerializerRuntimeHealth,
      xmlSchemaRuntimeHealth,
      xmlValidationRuntimeHealth,
      soapRuntimeHealth,
      operatorRuntimeHealth,
      authorizationRuntimeHealth,
      batchRuntimeHealth,
      protocolRuntimeHealth,
      returnRuntimeHealth,
      xsdRuntimeHealth,
      namespaceRuntimeHealth,
      queueRuntimeHealth,
      workerRuntimeHealth,
      schedulerRuntimeHealth,
      persistentQueueRuntimeHealth,
      observabilityRuntimeHealth,
      scalabilityRuntimeHealth,
      scannerRuntimeHealth,
      watchFolderRuntimeHealth,
      uploadRuntimeHealth,
      intelligentCaptureRuntimeHealth,
      tissRuntimeHealth,
      aiProviderRuntimeHealth,
      aiProviderHealth,
    ] = await Promise.all([
      this.documentIntakePort.health(),
      this.orchestratorPort.health(),
      this.documentIntakeRuntimePort.health(),
      this.captureEngineRuntimePort.health(),
      this.ocrRuntimePort.health(),
      this.ocrProviderPort.health(),
      this.documentClassificationProviderPort.health(),
      this.documentClassificationRuntimePort.health(),
      this.documentExtractionRuntimePort.health(),
      this.validationRuntimePort.health(),
      this.aiOrchestrationRuntimePort.health(),
      this.auditRuntimePort.health(),
      this.tissMappingRuntimePort.health(),
      this.autoFillRuntimePort.health(),
      this.qualityRuntimePort.health(),
      this.xmlTissRuntimePort.health(),
      this.storageProviderPort.health(),
      this.storageManagerRuntimePort.health(),
      this.searchProviderPort.health(),
      this.documentSearchRuntimePort.health(),
      this.tissProviderPort.health(),
      this.tissCatalogPort.health(),
      this.rulePackEnginePort.health(),
      this.xmlGenerationRuntimePort.health(),
      this.xmlRuntimePort.health(),
      this.xmlSerializerRuntimePort.health(),
      this.xmlSchemaRuntimePort.health(),
      this.xmlValidationRuntimePort.health(),
      this.soapRuntimePort.health(),
      this.operatorRuntimePort.health(),
      this.authorizationRuntimePort.health(),
      this.batchRuntimePort.health(),
      this.protocolRuntimePort.health(),
      this.returnRuntimePort.health(),
      this.xsdRuntimePort.health(),
      this.namespaceRuntimePort.health(),
      this.queueRuntimePort.health(),
      this.workerRuntimePort.health(),
      this.schedulerRuntimePort.health(),
      this.persistentQueueRuntimePort.health(),
      this.observabilityRuntimePort.health(),
      this.scalabilityRuntimePort.health(),
      this.scannerRuntimePort.health(),
      this.watchFolderRuntimePort.health(),
      this.uploadRuntimePort.health(),
      this.intelligentCaptureRuntimePort.health(),
      this.tissRuntimePort.health(),
      this.aiProviderRuntimePort.health(),
      this.aiProviderPort.health(),
    ]);
    const end = nowMs();
    const ok =
      intakeHealth.ok &&
      orchestratorHealth.ok &&
      intakeRuntimeHealth.ok &&
      captureRuntimeHealth.ok &&
      ocrRuntimeHealth.ok &&
      ocrProviderHealth.ok &&
      classificationProviderHealth.ok &&
      classificationRuntimeHealth.ok &&
      documentExtractionRuntimeHealth.ok &&
      validationRuntimeHealth.ok &&
      aiOrchestrationRuntimeHealth.ok &&
      auditRuntimeHealth.ok &&
      tissMappingRuntimeHealth.ok &&
      autoFillRuntimeHealth.ok &&
      qualityRuntimeHealth.ok &&
      xmlTissRuntimeHealth.ok &&
      storageProviderHealth.ok &&
      storageManagerRuntimeHealth.ok &&
      searchProviderHealth.ok &&
      documentSearchRuntimeHealth.ok &&
      tissProviderHealth.ok &&
      tissCatalogHealth.ok &&
      rulePackEngineHealth.ok &&
      xmlGenerationRuntimeHealth.ok &&
      xmlRuntimeHealth.ok &&
      xmlSerializerRuntimeHealth.ok &&
      xmlSchemaRuntimeHealth.ok &&
      xmlValidationRuntimeHealth.ok &&
      soapRuntimeHealth.ok &&
      operatorRuntimeHealth.ok &&
      authorizationRuntimeHealth.ok &&
      batchRuntimeHealth.ok &&
      protocolRuntimeHealth.ok &&
      returnRuntimeHealth.ok &&
      xsdRuntimeHealth.ok &&
      namespaceRuntimeHealth.ok &&
      queueRuntimeHealth.ok &&
      workerRuntimeHealth.ok &&
      schedulerRuntimeHealth.ok &&
      persistentQueueRuntimeHealth.ok &&
      observabilityRuntimeHealth.ok &&
      scalabilityRuntimeHealth.ok &&
      scannerRuntimeHealth.ok &&
      watchFolderRuntimeHealth.ok &&
      uploadRuntimeHealth.ok &&
      intelligentCaptureRuntimeHealth.ok &&
      tissRuntimeHealth.ok &&
      aiProviderRuntimeHealth.ok &&
      aiProviderHealth.ok;
    return {
      ok,
      runtimeId: this.runtimeId,
      latencyMs: Math.max(0, Math.round(end - start)),
      documentIntakeOk: intakeHealth.ok,
      orchestratorOk: orchestratorHealth.ok,
      documentIntakeRuntimeOk: intakeRuntimeHealth.ok,
      captureEngineRuntimeOk: captureRuntimeHealth.ok,
      ocrRuntimeOk: ocrRuntimeHealth.ok,
      ocrProviderOk: ocrProviderHealth.ok,
      documentClassificationProviderOk: classificationProviderHealth.ok,
      documentClassificationRuntimeOk: classificationRuntimeHealth.ok,
      documentExtractionRuntimeOk: documentExtractionRuntimeHealth.ok,
      validationRuntimeOk: validationRuntimeHealth.ok,
      aiOrchestrationRuntimeOk: aiOrchestrationRuntimeHealth.ok,
      auditRuntimeOk: auditRuntimeHealth.ok,
      tissMappingRuntimeOk: tissMappingRuntimeHealth.ok,
      autoFillRuntimeOk: autoFillRuntimeHealth.ok,
      qualityRuntimeOk: qualityRuntimeHealth.ok,
      xmlTissRuntimeOk: xmlTissRuntimeHealth.ok,
      storageProviderOk: storageProviderHealth.ok,
      storageManagerRuntimeOk: storageManagerRuntimeHealth.ok,
      searchProviderOk: searchProviderHealth.ok,
      documentSearchRuntimeOk: documentSearchRuntimeHealth.ok,
      tissProviderOk: tissProviderHealth.ok,
      tissCatalogOk: tissCatalogHealth.ok,
      rulePackEngineOk: rulePackEngineHealth.ok,
      xmlGenerationRuntimeOk: xmlGenerationRuntimeHealth.ok,
      xmlRuntimeOk: xmlRuntimeHealth.ok,
      xmlSerializerRuntimeOk: xmlSerializerRuntimeHealth.ok,
      xmlSchemaRuntimeOk: xmlSchemaRuntimeHealth.ok,
      xmlValidationRuntimeOk: xmlValidationRuntimeHealth.ok,
      soapRuntimeOk: soapRuntimeHealth.ok,
      operatorRuntimeOk: operatorRuntimeHealth.ok,
      authorizationRuntimeOk: authorizationRuntimeHealth.ok,
      batchRuntimeOk: batchRuntimeHealth.ok,
      protocolRuntimeOk: protocolRuntimeHealth.ok,
      returnRuntimeOk: returnRuntimeHealth.ok,
      xsdRuntimeOk: xsdRuntimeHealth.ok,
      namespaceRuntimeOk: namespaceRuntimeHealth.ok,
      queueRuntimeOk: queueRuntimeHealth.ok,
      workerRuntimeOk: workerRuntimeHealth.ok,
      schedulerRuntimeOk: schedulerRuntimeHealth.ok,
      persistentQueueRuntimeOk: persistentQueueRuntimeHealth.ok,
      observabilityRuntimeOk: observabilityRuntimeHealth.ok,
      scalabilityRuntimeOk: scalabilityRuntimeHealth.ok,
      scannerRuntimeOk: scannerRuntimeHealth.ok,
      watchFolderRuntimeOk: watchFolderRuntimeHealth.ok,
      uploadRuntimeOk: uploadRuntimeHealth.ok,
      intelligentCaptureRuntimeOk: intelligentCaptureRuntimeHealth.ok,
      tissRuntimeOk: tissRuntimeHealth.ok,
      aiProviderRuntimeOk: aiProviderRuntimeHealth.ok,
      aiProviderOk: aiProviderHealth.ok,
      message: ok
        ? "Enterprise Runtime pronto (BatchRuntime/AuthorizationRuntime/OperatorRuntime/SOAPRuntime/XMLTISSRuntime/QualityRuntime/AuditRuntime/AIOrchestrationRuntime/ValidationRuntime/DocumentExtractionRuntime/IntelligentCaptureRuntime/UploadRuntime/WatchFolderRuntime/ScannerRuntime/TISSRuntime/ScalabilityRuntime/ObservabilityRuntime/PersistentQueueRuntime/SchedulerRuntime/WorkerRuntime/QueueRuntime/NamespaceRuntime/XSDRuntime/XMLValidationRuntime/XMLSchemaRuntime/XMLSerializerRuntime/XMLGenerationRuntime/XMLRuntime/RulePackEngine/TISSCatalog/TISSProvider + AIProviderRuntime + DocumentSearchRuntime/SearchProvider + StorageManagerRuntime/StorageProvider + DocumentClassificationRuntime/Provider + OCRRuntime + CaptureEngineRuntime + DocumentIntakeRuntime + Orchestrator + DocumentIntake)."
        : "Enterprise Runtime degradado — ver Ports.",
    };
  }

  /**
   * Integração ARCH-01 / DIP-01 / DIP-02 / DIP-03 / DIP-04 / DIP-05 / DIP-06:
   * Captura upload → Capture Engine Runtime → OCR Runtime → Classification Runtime
   * → Storage Manager Runtime → Document Search Runtime.
   *
   * Produto → Runtime → CaptureEngineRuntimePort
   *   → Orchestrator.startExecution → DocumentIntakeRuntime.registerIntake
   *   → DocumentIntakePort.createIntake
   *   → OCRRuntimePort.coordinateOcr (estrutural — sem OCR real)
   *   → DocumentClassificationRuntimePort.coordinateClassification (CLASS-01 Provider via classify())
   *   → StorageManagerRuntimePort.coordinateStorage → StorageProviderPort (STORAGE-01)
   *   → DocumentSearchRuntimePort.coordinateSearch → SearchProviderPort (SEARCH-01)
   */
  async registerCaptureDocumentIntake(
    input: RegisterCaptureDocumentIntakeInput,
  ): Promise<RegisterCaptureDocumentIntakeResult> {
    try {
      if (!input.sessionId || !input.documentId) {
        return {
          ok: false,
          message: "sessionId e documentId são obrigatórios.",
          code: "INVALID_INPUT",
        };
      }

      const correlationId = input.correlationId ?? undefined;
      const channel = input.channel ?? "capture-upload";

      const request: CanonicalCaptureRequest = {
        kind: "canonical-capture-request",
        identity: {
          kind: "canonical-capture-identity",
          documentId: input.documentId,
          documentKind: "capture-document",
        },
        metadata: {
          kind: "canonical-capture-metadata",
          sessionId: input.sessionId,
          tenantRef: input.tenantRef,
          correlationId,
          channel,
          tags: [
            "arch-01",
            "dip-01",
            "dip-02",
            "dip-03",
            "dip-04",
            "dip-05",
            "dip-06",
            "capture",
            channel,
          ],
          customAttributes: {
            source: "capture-upload",
            sessionId: input.sessionId,
            documentId: input.documentId,
          },
        },
        reference: {
          kind: "canonical-capture-reference",
          storageKey: input.storagePath,
          storageContainer: "clinical-documents",
          storageProvider: "product-capture",
          metadataId: input.sessionId,
          metadataNamespace: "product.capture",
        },
        capabilities: {
          kind: "canonical-capture-capabilities",
          declared: [
            "capture-upload-bridge",
            "capture-engine-runtime",
            "document-intake-runtime",
            "ocr-runtime",
            "document-classification-runtime",
            "storage-manager-runtime",
            "document-search-runtime",
          ],
        },
        configuration: {
          kind: "canonical-capture-configuration",
          sourceType: "UPLOAD",
          channel,
          priority: "NORMAL",
          notes:
            "DIP-06 bridge: capture upload registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime + Document Search Runtime (no real processing/storage/search).",
        },
        structuralNotes:
          "DIP-06 bridge: capture upload registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime + Document Search Runtime (no real processing/storage/search).",
      };

      const result = await this.captureEngineRuntimePort.registerCapture(request);

      if (!result.ok) {
        return {
          ok: false,
          intakeId: result.intakeId,
          executionId: result.executionId,
          runtimeSessionId: result.runtimeSessionId,
          ocrRuntimeSessionId: result.ocrRuntimeSessionId,
          ocrExecutionId: result.ocrExecutionId,
          classificationRuntimeSessionId: result.classificationRuntimeSessionId,
          classificationExecutionId: result.classificationExecutionId,
          storageManagerRuntimeSessionId: result.storageManagerRuntimeSessionId,
          storageExecutionId: result.storageExecutionId,
          documentSearchRuntimeSessionId: result.documentSearchRuntimeSessionId,
          searchExecutionId: result.searchExecutionId,
          message: result.message ?? "Capture Engine Runtime falhou.",
          code: result.code ?? "CAPTURE_RUNTIME_FAILED",
        };
      }

      // Rehidrata resultados dos Ports oficiais para compatibilidade ARCH-01 / DIP-01.
      const intake =
        result.intakeId != null
          ? await this.documentIntakePort.getIntake({ intakeId: result.intakeId })
          : undefined;
      const execution =
        result.executionId != null
          ? await this.orchestratorPort.getExecution({ executionId: result.executionId })
          : undefined;

      return {
        ok: true,
        intakeId: result.intakeId,
        executionId: result.executionId,
        runtimeSessionId: result.runtimeSessionId,
        ocrRuntimeSessionId: result.ocrRuntimeSessionId,
        ocrExecutionId: result.ocrExecutionId,
        classificationRuntimeSessionId: result.classificationRuntimeSessionId,
        classificationExecutionId: result.classificationExecutionId,
        storageManagerRuntimeSessionId: result.storageManagerRuntimeSessionId,
        storageExecutionId: result.storageExecutionId,
        documentSearchRuntimeSessionId: result.documentSearchRuntimeSessionId,
        searchExecutionId: result.searchExecutionId,
        intake: intake
          ? {
              ok: intake.ok,
              intakeId: result.intakeId!,
              intake: intake.intake,
              message: intake.message,
              code: intake.code,
            }
          : undefined,
        execution: execution,
        message:
          result.message ??
          "Capture document registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime + Document Search Runtime (structural).",
        code: result.code,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
      };
    }
  }
}
