/**
 * Referência estrutural obrigatória — futuro consumidor OCR Pipeline (INF-03).
 *
 * O OCR NÃO utiliza o Scheduler Foundation nesta sprint.
 * Este artefato apenas registra que, futuramente, o OCR Pipeline
 * utilizará o Scheduler Foundation exclusivamente através do ExecutionSchedulerPort.
 *
 * É PROIBIDO:
 * - integrar OCR real
 * - executar Schedules
 * - utilizar cron / timers
 * - invocar OCRProviderPort
 * - alterar o módulo ocr-provider
 */

/** Identificador estável da referência estrutural do futuro consumidor OCR. */
export const OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_ID =
  "ocr-pipeline-future-scheduler-foundation-consumer" as const;

/**
 * Referência estrutural — futuro OCR Pipeline ↔ ExecutionSchedulerPort.
 * Nenhuma integração real. Nenhuma execução. Nenhum processamento.
 */
export type OcrPipelineSchedulerFoundationConsumerReference = {
  kind: "ocr-pipeline-scheduler-foundation-consumer-reference";
  consumerId: typeof OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_ID;
  /** Port oficial que o OCR Pipeline usará no futuro. */
  portContract: "ExecutionSchedulerPort";
  portRef: "ExecutionSchedulerPort";
  /** Worker Port conhecido exclusivamente via Scheduler Foundation. */
  workerPortContract: "ExecutionWorkerPort";
  /** Declara intenção futura de uso do Scheduler Foundation. */
  willUseSchedulerFoundationViaPort: true;
  /** OCR NÃO utiliza Schedulers nesta sprint. */
  currentlyUsesScheduler: false;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
  enginesInvoked: false;
  ocrInvoked: false;
  implementsOcr: false;
  realSchedulerBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

/** Constante canônica da referência estrutural OCR → Scheduler Foundation. */
export const OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE: OcrPipelineSchedulerFoundationConsumerReference =
  {
    kind: "ocr-pipeline-scheduler-foundation-consumer-reference",
    consumerId: OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_ID,
    portContract: "ExecutionSchedulerPort",
    portRef: "ExecutionSchedulerPort",
    workerPortContract: "ExecutionWorkerPort",
    willUseSchedulerFoundationViaPort: true,
    currentlyUsesScheduler: false,
    executionPerformed: false,
    scheduleExecuted: false,
    cronUsed: false,
    timersUsed: false,
    jobsDispatched: false,
    workersStarted: false,
    processingPerformed: false,
    enginesInvoked: false,
    ocrInvoked: false,
    implementsOcr: false,
    realSchedulerBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-03 structural consumer reference — OCR Pipeline will use ExecutionSchedulerPort in the future; OCR does NOT use Schedulers in this sprint",
  };
