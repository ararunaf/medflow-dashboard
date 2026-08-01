/**
 * Referência estrutural obrigatória — futuro consumidor OCR Pipeline (INF-01).
 *
 * O OCR NÃO utiliza a fila nesta sprint.
 * Este artefato apenas registra que, futuramente, o OCR Pipeline
 * utilizará o Message Queue exclusivamente através do ExecutionQueuePort.
 *
 * É PROIBIDO:
 * - integrar OCR real
 * - publicar mensagens
 * - consumir mensagens
 * - invocar OCRProviderPort
 * - alterar o módulo ocr-provider
 */

/** Identificador estável da referência estrutural do futuro consumidor OCR. */
export const OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_ID =
  "ocr-pipeline-future-message-queue-consumer" as const;

/**
 * Referência estrutural — futuro OCR Pipeline ↔ ExecutionQueuePort.
 * Nenhuma integração real. Nenhum consumo. Nenhuma publicação.
 */
export type OcrPipelineMessageQueueConsumerReference = {
  kind: "ocr-pipeline-message-queue-consumer-reference";
  consumerId: typeof OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_ID;
  /** Port oficial que o OCR Pipeline usará no futuro. */
  portContract: "ExecutionQueuePort";
  portRef: "ExecutionQueuePort";
  /** Declara intenção futura de uso do Message Queue. */
  willUseMessageQueueViaPort: true;
  /** OCR NÃO utiliza a fila nesta sprint. */
  currentlyUsesQueue: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  enginesInvoked: false;
  ocrInvoked: false;
  implementsOcr: false;
  realQueueBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

/** Constante canônica da referência estrutural OCR → Message Queue. */
export const OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_REFERENCE: OcrPipelineMessageQueueConsumerReference =
  {
    kind: "ocr-pipeline-message-queue-consumer-reference",
    consumerId: OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_ID,
    portContract: "ExecutionQueuePort",
    portRef: "ExecutionQueuePort",
    willUseMessageQueueViaPort: true,
    currentlyUsesQueue: false,
    messagesPublished: false,
    messagesConsumed: false,
    workersInvoked: false,
    processingPerformed: false,
    enginesInvoked: false,
    ocrInvoked: false,
    implementsOcr: false,
    realQueueBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-01 structural consumer reference — OCR Pipeline will use ExecutionQueuePort in the future; OCR does NOT use the queue in this sprint",
  };
