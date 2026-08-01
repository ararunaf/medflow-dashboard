/**
 * Referência estrutural obrigatória — futuro consumidor OCR Pipeline (INF-02).
 *
 * O OCR NÃO utiliza o Worker Foundation nesta sprint.
 * Este artefato apenas registra que, futuramente, o OCR Pipeline
 * utilizará o Worker Foundation exclusivamente através do ExecutionWorkerPort.
 *
 * É PROIBIDO:
 * - integrar OCR real
 * - executar Workers
 * - processar mensagens
 * - invocar OCRProviderPort
 * - alterar o módulo ocr-provider
 */

/** Identificador estável da referência estrutural do futuro consumidor OCR. */
export const OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_ID =
  "ocr-pipeline-future-worker-foundation-consumer" as const;

/**
 * Referência estrutural — futuro OCR Pipeline ↔ ExecutionWorkerPort.
 * Nenhuma integração real. Nenhuma execução. Nenhum processamento.
 */
export type OcrPipelineWorkerFoundationConsumerReference = {
  kind: "ocr-pipeline-worker-foundation-consumer-reference";
  consumerId: typeof OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_ID;
  /** Port oficial que o OCR Pipeline usará no futuro. */
  portContract: "ExecutionWorkerPort";
  portRef: "ExecutionWorkerPort";
  /** Queue Port conhecido exclusivamente via Worker Foundation. */
  queuePortContract: "ExecutionQueuePort";
  /** Declara intenção futura de uso do Worker Foundation. */
  willUseWorkerFoundationViaPort: true;
  /** OCR NÃO utiliza Workers nesta sprint. */
  currentlyUsesWorker: false;
  executionPerformed: false;
  threadsSpawned: false;
  backgroundJobsStarted: false;
  concurrencyEnabled: false;
  messagesConsumed: false;
  processingPerformed: false;
  enginesInvoked: false;
  ocrInvoked: false;
  implementsOcr: false;
  realWorkerBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

/** Constante canônica da referência estrutural OCR → Worker Foundation. */
export const OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_REFERENCE: OcrPipelineWorkerFoundationConsumerReference =
  {
    kind: "ocr-pipeline-worker-foundation-consumer-reference",
    consumerId: OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_ID,
    portContract: "ExecutionWorkerPort",
    portRef: "ExecutionWorkerPort",
    queuePortContract: "ExecutionQueuePort",
    willUseWorkerFoundationViaPort: true,
    currentlyUsesWorker: false,
    executionPerformed: false,
    threadsSpawned: false,
    backgroundJobsStarted: false,
    concurrencyEnabled: false,
    messagesConsumed: false,
    processingPerformed: false,
    enginesInvoked: false,
    ocrInvoked: false,
    implementsOcr: false,
    realWorkerBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-02 structural consumer reference — OCR Pipeline will use ExecutionWorkerPort in the future; OCR does NOT use Workers in this sprint",
  };
