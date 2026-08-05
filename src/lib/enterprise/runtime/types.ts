/**
 * Tipos do Enterprise Runtime — ARCH-01 / DIP-01…DIP-06 / ARCH-02 (DIP-07).
 *
 * Runtime é o ponto único de acesso do produto à Enterprise Foundation.
 * Sem regras de negócio. Sem XML/TISS reais / classificação/storage/busca reais. Sem filas/workers reais.
 * INF-06: Worker Runtime estrutural — sem Workers reais / Scheduler / Thread Pool.
 * INF-07: Scheduler Runtime estrutural — sem Scheduler real / Cron / Timer.
 * INF-08: Persistent Queue Runtime estrutural — sem fila persistente real / RabbitMQ / Kafka.
 * INF-09: Observability Runtime estrutural — sem OpenTelemetry / Application Insights / Prometheus.
 * INF-10: Scalability Runtime estrutural — sem Kubernetes / Auto Scaling / Cluster / Load Balancer.
 * F3-CAP-01: Scanner Runtime estrutural — sem Scanner real / TWAIN / WIA / ISIS / Drivers.
 * F3-CAP-02: Watch Folder Runtime estrutural — sem Watch Folder real / FileSystemWatcher / Polling / SMB / UNC / Azure Files.
 * F3-CAP-03: Upload Runtime estrutural — sem Upload real / Web / Desktop / Mobile / API / Multipart / Chunked / Resumable / Azure Blob / Supabase / S3 / Drive / OneDrive / Dropbox.
 * F3-CAP-04: Intelligent Capture Runtime estrutural — orquestração Scanner/WatchFolder/Upload sem OCR / IA / Pipeline / captura automática / leitura de arquivos.
 * OCR: acesso exclusivo via OCR Runtime → OCRProviderPort (OCR-01).
 * F3-CAP-06: Document Classification Runtime estrutural — sem IA / sem ML / sem LLM / sem OCR real / sem template matching / sem roteamento automático / sem visão computacional.
 * Classification: acesso exclusivo via Classification Runtime (F3-CAP-06) → ProviderPort (CLASS-01).
 * F3-CAP-07: Document Extraction Runtime estrutural — sem extração real / sem OCR / sem IA / sem ML / sem LLM / sem Regex / sem Template Matching / sem leitura de campos / sem preenchimento de guias.
 * F3-CAP-08: Validation Runtime estrutural — sem validação real / sem auditoria / sem IA / sem ML / sem LLM / sem correção automática / sem regras TISS / sem regras de operadoras / sem aprovação/rejeição automática.
 * F3-CAP-09: AI Orchestration Runtime estrutural — sem IA real / sem OpenAI / sem Azure OpenAI / sem Gemini / sem Claude / sem Ollama / sem Llama / sem ML / sem Prompt Engineering / sem HTTP / sem agentes funcionais / sem workflow / sem decisão automática.
 * F3-CAP-10: Audit Runtime estrutural — sem auditoria real / sem IA / sem OpenAI / sem Azure OpenAI / sem Gemini / sem Claude / sem ML / sem regras TISS / sem regras de operadoras / sem justificativas automáticas / sem correções automáticas / sem aprovação/rejeição automática.
 * F3-CAP-11: TISS Mapping Runtime estrutural — sem mapeamento funcional / sem operadoras / sem XML / sem preenchimento automático / sem IA / sem banco / sem persistência / sem APIs.
 * F3-CAP-12: Auto-Fill Runtime estrutural — sem preenchimento automático / sem geração de XML / sem escrita em guias / sem integração com operadoras / sem IA / sem banco / sem persistência / sem APIs.
 * F3-CAP-13: Quality Runtime estrutural — sem avaliação automática / sem score funcional / sem decisão automática / sem IA / sem OCR / sem auditoria automática / sem banco / sem persistência / sem APIs.
 * C-01: XML TISS Runtime estrutural — sem geração de XML / sem serialização / sem parser / sem XSD / sem SOAP / sem operadoras / sem banco / sem persistência / sem APIs.
 * Search: acesso exclusivo via Document Search Runtime → SearchProviderPort (SEARCH-01).
 * TISS: acesso exclusivo via TISS Runtime → TISSCatalogPort + RulePackEnginePort + XMLRuntimePort + XMLGenerationRuntimePort + XMLSerializerRuntimePort + XMLSchemaRuntimePort + XMLValidationRuntimePort + XSDRuntimePort + NamespaceRuntimePort + TISSProviderPort (TISS-01…10).
 * IA: acesso exclusivo via AI Provider Runtime → AIProviderPort (ARCH-02).
 */
import type { CanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { CaptureEngineRuntimePort } from "../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { DocumentClassificationProviderPort } from "../document-classification-provider/ports/document-classification-provider-port";
import type { DocumentClassificationRuntimePort } from "../document-classification-runtime/ports/document-classification-runtime-port";
import type { DocumentExtractionRuntimePort } from "../document-extraction-runtime/ports/document-extraction-runtime-port";
import type { ValidationRuntimePort } from "../validation-runtime/ports/validation-runtime-port";
import type { AIOrchestrationRuntimePort } from "../ai-orchestration-runtime/ports/ai-orchestration-runtime-port";
import type { AuditRuntimePort } from "../audit-runtime/ports/audit-runtime-port";
import type { TISSMappingRuntimePort } from "../tiss-mapping-runtime/ports/tiss-mapping-runtime-port";
import type { AutoFillRuntimePort } from "../auto-fill-runtime/ports/auto-fill-runtime-port";
import type { QualityRuntimePort } from "../quality-runtime/ports/quality-runtime-port";
import type { XMLTISSRuntimePort } from "../xml-tiss-runtime/ports/xml-tiss-runtime-port";
import type { DocumentIntakePort } from "../document-intake/ports/document-intake-port";
import type { CreateIntakeResult } from "../document-intake/ports/types";
import type { StartExecutionResult } from "../canonical-execution-orchestrator/ports/types";
import type { DocumentIntakeRuntimePort } from "../document-intake-runtime/ports/document-intake-runtime-port";
import type { DocumentSearchRuntimePort } from "../document-search-runtime/ports/document-search-runtime-port";
import type { OCRRuntimePort } from "../ocr-runtime/ports/ocr-runtime-port";
import type { OCRProviderPort } from "../ocr-provider/ports/ocr-provider-port";
import type { RulePackEnginePort } from "../rule-pack-engine/ports/rule-pack-engine-port";
import type { SearchProviderPort } from "../search-provider/ports/search-provider-port";
import type { StorageManagerRuntimePort } from "../storage-manager-runtime/ports/storage-manager-runtime-port";
import type { StorageProviderPort } from "../storage-provider/ports/storage-provider-port";
import type { AIProviderPort } from "../ai-provider/ports/ai-provider-port";
import type { AIProviderRuntimePort } from "../ai-provider-runtime/ports/ai-provider-runtime-port";
import type { TISSCatalogPort } from "../tiss-catalog/ports/tiss-catalog-port";
import type { TISSProviderPort } from "../tiss-provider/ports/tiss-provider-port";
import type { TISSRuntimePort } from "../tiss-runtime/ports/tiss-runtime-port";
import type { XMLGenerationRuntimePort } from "../xml-generation-runtime/ports/xml-generation-runtime-port";
import type { XMLRuntimePort } from "../xml-runtime/ports/xml-runtime-port";
import type { XMLSchemaRuntimePort } from "../xml-schema-runtime/ports/xml-schema-runtime-port";
import type { XMLSerializerRuntimePort } from "../xml-serializer-runtime/ports/xml-serializer-runtime-port";
import type { XMLValidationRuntimePort } from "../xml-validation-runtime/ports/xml-validation-runtime-port";
import type { SOAPRuntimePort } from "../soap-runtime/ports/soap-runtime-port";
import type { OperatorRuntimePort } from "../operator-runtime/ports/operator-runtime-port";
import type { AuthorizationRuntimePort } from "../authorization-runtime/ports/authorization-runtime-port";
import type { BatchRuntimePort } from "../batch-runtime/ports/batch-runtime-port";
import type { ProtocolRuntimePort } from "../protocol-runtime/ports/protocol-runtime-port";
import type { XSDRuntimePort } from "../xsd-runtime/ports/xsd-runtime-port";
import type { NamespaceRuntimePort } from "../namespace-runtime/ports/namespace-runtime-port";
import type { QueueRuntimePort } from "../queue-runtime/ports/queue-runtime-port";
import type { PersistentQueueRuntimePort } from "../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ObservabilityRuntimePort } from "../observability-runtime/ports/observability-runtime-port";
import type { ScalabilityRuntimePort } from "../scalability-runtime/ports/scalability-runtime-port";
import type { SchedulerRuntimePort } from "../scheduler-runtime/ports/scheduler-runtime-port";
import type { WorkerRuntimePort } from "../worker-runtime/ports/worker-runtime-port";
import type { ScannerRuntimePort } from "../scanner-runtime/ports/scanner-runtime-port";
import type { WatchFolderRuntimePort } from "../watch-folder-runtime/ports/watch-folder-runtime-port";
import type { UploadRuntimePort } from "../upload-runtime/ports/upload-runtime-port";
import type { IntelligentCaptureRuntimePort } from "../intelligent-capture-runtime/ports/intelligent-capture-runtime-port";

/** Identificador estável do runtime. */
export type EnterpriseRuntimeId = "default" | "test";

/** Saúde agregada do runtime (Ports resolvidos). */
export type EnterpriseRuntimeHealth = {
  ok: boolean;
  runtimeId: EnterpriseRuntimeId;
  latencyMs?: number;
  message?: string;
  documentIntakeOk: boolean;
  orchestratorOk: boolean;
  documentIntakeRuntimeOk?: boolean;
  captureEngineRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  ocrProviderOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  documentClassificationProviderOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  aiOrchestrationRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  xmlTissRuntimeOk?: boolean;
  storageManagerRuntimeOk?: boolean;
  storageProviderOk?: boolean;
  searchProviderOk?: boolean;
  documentSearchRuntimeOk?: boolean;
  tissProviderOk?: boolean;
  tissCatalogOk?: boolean;
  rulePackEngineOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlGenerationRuntimeOk?: boolean;
  xmlSerializerRuntimeOk?: boolean;
  xmlSchemaRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  batchRuntimeOk?: boolean;
  protocolRuntimeOk?: boolean;
  xsdRuntimeOk?: boolean;
  namespaceRuntimeOk?: boolean;
  queueRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  tissRuntimeOk?: boolean;
  aiProviderRuntimeOk?: boolean;
  aiProviderOk?: boolean;
};

/**
 * Entrada estrutural para registrar um upload de Captura como Document Intake.
 * Apenas referências opacas — sem interpretação clínica/OCR/TISS/classificação/storage.
 */
export type RegisterCaptureDocumentIntakeInput = {
  sessionId: string;
  documentId: string;
  storagePath?: string;
  tenantRef?: string;
  correlationId?: string | null;
  channel?: string;
};

/** Resultado estrutural do bridge Captura → Enterprise. */
export type RegisterCaptureDocumentIntakeResult = {
  ok: boolean;
  intakeId?: string;
  executionId?: string;
  runtimeSessionId?: string;
  /** DIP-03 / OCR-01 — sessão OCR Runtime (coordenação; execução via processOcr). */
  ocrRuntimeSessionId?: string;
  ocrExecutionId?: string;
  /** DIP-04 — sessão Classification Runtime (coordenação estrutural, sem classificação real). */
  classificationRuntimeSessionId?: string;
  classificationExecutionId?: string;
  /** DIP-05 / STORAGE-01 — sessão Storage Manager Runtime. */
  storageManagerRuntimeSessionId?: string;
  storageExecutionId?: string;
  /** DIP-06 — sessão Document Search Runtime (coordenação estrutural, sem busca real). */
  documentSearchRuntimeSessionId?: string;
  searchExecutionId?: string;
  intake?: CreateIntakeResult;
  execution?: StartExecutionResult;
  message?: string;
  code?: string;
};

/** Opções de criação do Enterprise Runtime. */
export type EnterpriseRuntimeOptions = {
  runtimeId?: EnterpriseRuntimeId;
  /**
   * Ports pré-resolvidos (testes / DI).
   * Em produção o Runtime resolve via factories oficiais.
   */
  documentIntakePort?: DocumentIntakePort;
  orchestratorPort?: CanonicalExecutionOrchestratorPort;
  documentIntakeRuntimePort?: DocumentIntakeRuntimePort;
  captureEngineRuntimePort?: CaptureEngineRuntimePort;
  ocrRuntimePort?: OCRRuntimePort;
  ocrProviderPort?: OCRProviderPort;
  documentClassificationProviderPort?: DocumentClassificationProviderPort;
  documentClassificationRuntimePort?: DocumentClassificationRuntimePort;
  documentExtractionRuntimePort?: DocumentExtractionRuntimePort;
  validationRuntimePort?: ValidationRuntimePort;
  aiOrchestrationRuntimePort?: AIOrchestrationRuntimePort;
  auditRuntimePort?: AuditRuntimePort;
  tissMappingRuntimePort?: TISSMappingRuntimePort;
  autoFillRuntimePort?: AutoFillRuntimePort;
  qualityRuntimePort?: QualityRuntimePort;
  xmlTissRuntimePort?: XMLTISSRuntimePort;
  storageProviderPort?: StorageProviderPort;
  storageManagerRuntimePort?: StorageManagerRuntimePort;
  searchProviderPort?: SearchProviderPort;
  documentSearchRuntimePort?: DocumentSearchRuntimePort;
  tissProviderPort?: TISSProviderPort;
  tissCatalogPort?: TISSCatalogPort;
  rulePackEnginePort?: RulePackEnginePort;
  xmlRuntimePort?: XMLRuntimePort;
  xmlGenerationRuntimePort?: XMLGenerationRuntimePort;
  xmlSerializerRuntimePort?: XMLSerializerRuntimePort;
  xmlSchemaRuntimePort?: XMLSchemaRuntimePort;
  xmlValidationRuntimePort?: XMLValidationRuntimePort;
  soapRuntimePort?: SOAPRuntimePort;
  operatorRuntimePort?: OperatorRuntimePort;
  authorizationRuntimePort?: AuthorizationRuntimePort;
  batchRuntimePort?: BatchRuntimePort;
  protocolRuntimePort?: ProtocolRuntimePort;
  xsdRuntimePort?: XSDRuntimePort;
  namespaceRuntimePort?: NamespaceRuntimePort;
  queueRuntimePort?: QueueRuntimePort;
  workerRuntimePort?: WorkerRuntimePort;
  schedulerRuntimePort?: SchedulerRuntimePort;
  persistentQueueRuntimePort?: PersistentQueueRuntimePort;
  observabilityRuntimePort?: ObservabilityRuntimePort;
  scalabilityRuntimePort?: ScalabilityRuntimePort;
  scannerRuntimePort?: ScannerRuntimePort;
  watchFolderRuntimePort?: WatchFolderRuntimePort;
  uploadRuntimePort?: UploadRuntimePort;
  intelligentCaptureRuntimePort?: IntelligentCaptureRuntimePort;
  tissRuntimePort?: TISSRuntimePort;
  aiProviderPort?: AIProviderPort;
  aiProviderRuntimePort?: AIProviderRuntimePort;
};

/**
 * Enterprise Runtime — composição e acesso oficial à Foundation.
 *
 * Responsabilidades:
 * - resolver Providers / Ports
 * - disponibilizar Adapters via factories
 * - inicializar Canonical Execution Orchestrator
 * - expor Document Intake Runtime (DIP-01)
 * - expor Capture Engine Runtime (DIP-02)
 * - expor OCR Runtime (DIP-03 / OCR-01)
 * - expor Document Classification Runtime (DIP-04)
 * - expor Storage Manager Runtime (DIP-05)
 * - expor Document Search Runtime (DIP-06)
 * - expor AI Provider Runtime (ARCH-02 / DIP-07)
 * - expor bridge estrutural para o produto
 *
 * NÃO contém regras de negócio. NÃO executa busca real.
 * OCR: exclusivamente via OCRRuntimePort → OCRProviderPort.
 * Classification: exclusivamente via DocumentClassificationRuntimePort (F3-CAP-06) → ProviderPort (CLASS-01).
 * Storage: exclusivamente via StorageManagerRuntimePort → StorageProviderPort (STORAGE-01).
 * IA: exclusivamente via AIProviderRuntimePort → AIProviderPort.
 */
export interface EnterpriseRuntime {
  readonly runtimeId: EnterpriseRuntimeId;

  /** Resolve DocumentIntakePort (EPC-12). */
  getDocumentIntakePort(): DocumentIntakePort;

  /** Resolve CanonicalExecutionOrchestratorPort (EPC-24). */
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;

  /** Resolve DocumentIntakeRuntimePort (DIP-01). */
  getDocumentIntakeRuntimePort(): DocumentIntakeRuntimePort;

  /** Resolve CaptureEngineRuntimePort (DIP-02). */
  getCaptureEngineRuntimePort(): CaptureEngineRuntimePort;

  /** Resolve OCRRuntimePort (DIP-03 / OCR-01). */
  getOCRRuntimePort(): OCRRuntimePort;

  /** Resolve OCRProviderPort (EPC-15 / OCR-01) — Adapter oficial. */
  getOCRProviderPort(): OCRProviderPort;

  /** Resolve DocumentClassificationRuntimePort (F3-CAP-06 + DIP-04 / CLASS-01 preservado). */
  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort;

  /** Resolve DocumentClassificationProviderPort (CLASS-01) — Adapter oficial. */
  getDocumentClassificationProviderPort(): DocumentClassificationProviderPort;

  /** Resolve DocumentExtractionRuntimePort (F3-CAP-07). */
  getDocumentExtractionRuntimePort(): DocumentExtractionRuntimePort;

  /** Resolve ValidationRuntimePort (F3-CAP-08). */
  getValidationRuntimePort(): ValidationRuntimePort;

  /** Resolve AIOrchestrationRuntimePort (F3-CAP-09). */
  getAIOrchestrationRuntimePort(): AIOrchestrationRuntimePort;

  /** Resolve AuditRuntimePort (F3-CAP-10). */
  getAuditRuntimePort(): AuditRuntimePort;

  /** Resolve TISSMappingRuntimePort (F3-CAP-11). */
  getTISSMappingRuntimePort(): TISSMappingRuntimePort;

  /** Resolve AutoFillRuntimePort (F3-CAP-12). */
  getAutoFillRuntimePort(): AutoFillRuntimePort;

  /** Resolve QualityRuntimePort (F3-CAP-13). */
  getQualityRuntimePort(): QualityRuntimePort;

  /** Resolve XMLTISSRuntimePort (C-01). */
  getXMLTISSRuntimePort(): XMLTISSRuntimePort;

  /** Resolve StorageManagerRuntimePort (DIP-05 / STORAGE-01). */
  getStorageManagerRuntimePort(): StorageManagerRuntimePort;

  /** Resolve StorageProviderPort (STORAGE-01) — Adapter oficial. */
  getStorageProviderPort(): StorageProviderPort;

  /** Resolve SearchProviderPort (SEARCH-01) — Adapter oficial. */
  getSearchProviderPort(): SearchProviderPort;

  /** Resolve DocumentSearchRuntimePort (DIP-06 / SEARCH-01). */
  getDocumentSearchRuntimePort(): DocumentSearchRuntimePort;

  /** Resolve TISSProviderPort (TISS-01) — Adapter oficial. */
  getTISSProviderPort(): TISSProviderPort;

  /** Resolve TISSCatalogPort (TISS-02) — Catálogo Canônico oficial. */
  getTISSCatalogPort(): TISSCatalogPort;

  /** Resolve RulePackEnginePort (TISS-03) — Enterprise Rule Pack Engine. */
  getRulePackEnginePort(): RulePackEnginePort;

  /** Resolve XMLRuntimePort (TISS-04) — Enterprise XML Runtime Foundation. */
  getXMLRuntimePort(): XMLRuntimePort;

  /** Resolve XMLGenerationRuntimePort (TISS-05) — Enterprise XML Generation Runtime. */
  getXMLGenerationRuntimePort(): XMLGenerationRuntimePort;

  /** Resolve XMLSerializerRuntimePort (TISS-06) — Enterprise XML Serializer Runtime. */
  getXMLSerializerRuntimePort(): XMLSerializerRuntimePort;

  /** Resolve XMLSchemaRuntimePort (TISS-07) — Enterprise XML Schema Runtime. */
  getXMLSchemaRuntimePort(): XMLSchemaRuntimePort;

  /** Resolve XMLValidationRuntimePort (C-02) — Enterprise XML Validation Runtime. */
  getXMLValidationRuntimePort(): XMLValidationRuntimePort;

  /** Resolve SOAPRuntimePort (C-03) — Enterprise SOAP Runtime Foundation. */
  getSOAPRuntimePort(): SOAPRuntimePort;

  /** Resolve OperatorRuntimePort (C-04) — Enterprise Operator Runtime Foundation. */
  getOperatorRuntimePort(): OperatorRuntimePort;

  /** Resolve AuthorizationRuntimePort (C-05) — Enterprise Authorization Runtime Foundation. */
  getAuthorizationRuntimePort(): AuthorizationRuntimePort;

  /** Resolve BatchRuntimePort (C-06) — Enterprise Batch Runtime Foundation. */
  getBatchRuntimePort(): BatchRuntimePort;

  /** Resolve ProtocolRuntimePort (C-07) — Enterprise Protocol Runtime Foundation. */
  getProtocolRuntimePort(): ProtocolRuntimePort;

  /** Resolve XSDRuntimePort (TISS-09) — Enterprise XSD Runtime. */
  getXSDRuntimePort(): XSDRuntimePort;

  /** Resolve NamespaceRuntimePort (TISS-10) — Enterprise Namespace Runtime. */
  getNamespaceRuntimePort(): NamespaceRuntimePort;

  /** Resolve QueueRuntimePort (INF-05) — Enterprise Queue Runtime. */
  getQueueRuntimePort(): QueueRuntimePort;

  /** Resolve WorkerRuntimePort (INF-06) — Enterprise Worker Runtime. */
  getWorkerRuntimePort(): WorkerRuntimePort;

  /** Resolve SchedulerRuntimePort (INF-07) — Enterprise Scheduler Runtime. */
  getSchedulerRuntimePort(): SchedulerRuntimePort;

  /** Resolve PersistentQueueRuntimePort (INF-08) — Enterprise Persistent Queue Runtime. */
  getPersistentQueueRuntimePort(): PersistentQueueRuntimePort;

  /** Resolve ObservabilityRuntimePort (INF-09) — Enterprise Observability Runtime. */
  getObservabilityRuntimePort(): ObservabilityRuntimePort;

  /** Resolve ScalabilityRuntimePort (INF-10) — Enterprise Scalability Runtime. */
  getScalabilityRuntimePort(): ScalabilityRuntimePort;

  /** Resolve ScannerRuntimePort (F3-CAP-01) — Enterprise Scanner Runtime Foundation. */
  getScannerRuntimePort(): ScannerRuntimePort;

  /** Resolve WatchFolderRuntimePort (F3-CAP-02) — Enterprise Watch Folder Runtime Foundation. */
  getWatchFolderRuntimePort(): WatchFolderRuntimePort;

  /** Resolve UploadRuntimePort (F3-CAP-03) — Enterprise Upload Runtime Foundation. */
  getUploadRuntimePort(): UploadRuntimePort;

  /** Resolve IntelligentCaptureRuntimePort (F3-CAP-04) — Enterprise Intelligent Capture Integration Foundation. */
  getIntelligentCaptureRuntimePort(): IntelligentCaptureRuntimePort;

  /** Resolve TISSRuntimePort (TISS-01…TISS-10 + INF-05 Queue + INF-06 Worker + INF-07 Scheduler + INF-08 PersistentQueue + INF-09 Observability + INF-10 Scalability deps). */
  getTISSRuntimePort(): TISSRuntimePort;

  /** Resolve AIProviderPort (EPC-07) — Adapter oficial. */
  getAIProviderPort(): AIProviderPort;

  /** Resolve AIProviderRuntimePort (ARCH-02 / DIP-07). */
  getAIProviderRuntimePort(): AIProviderRuntimePort;

  /**
   * Bridge oficial Captura → Foundation (DIP-02 / DIP-03 / DIP-04 / DIP-05 / DIP-06).
   *
   * Fluxo:
   *   Produto → Runtime → CaptureEngineRuntimePort
   *     → Orchestrator → DocumentIntakeRuntime → DocumentIntakePort → Adapter
   *     → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural)
   *     → DocumentClassificationRuntimePort → Orchestrator
   *     → DocumentClassificationRuntimePort → DocumentClassificationProviderPort (CLASS-01)
   *     → StorageManagerRuntimePort → Orchestrator
   *     → StorageProviderPort → Storage Provider Adapter (STORAGE-01)
   *     → DocumentSearchRuntimePort → Orchestrator
   *     → SearchProviderPort → Search Provider Adapter (SEARCH-01)
   *
   * Best-effort: nunca lança para o produto; falhas retornam ok:false.
   */
  registerCaptureDocumentIntake(
    input: RegisterCaptureDocumentIntakeInput,
  ): Promise<RegisterCaptureDocumentIntakeResult>;

  /** Health agregado dos Ports resolvidos. */
  health(): Promise<EnterpriseRuntimeHealth>;
}
