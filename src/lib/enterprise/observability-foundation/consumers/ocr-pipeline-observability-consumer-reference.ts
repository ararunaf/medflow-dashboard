/**
 * Referência estrutural obrigatória — futuro consumidor OCR Pipeline (INF-04).
 *
 * O OCR NÃO utiliza o Observability Foundation nesta sprint.
 * Este artefato apenas registra que, futuramente, o OCR Pipeline
 * utilizará o Observability Foundation exclusivamente através do ExecutionObservabilityPort.
 *
 * É PROIBIDO:
 * - integrar OCR real
 * - implementar logs / métricas / tracing
 * - invocar OCRProviderPort
 * - alterar o módulo ocr-provider
 */

/** Identificador estável da referência estrutural do futuro consumidor OCR. */
export const OCR_PIPELINE_OBSERVABILITY_FOUNDATION_CONSUMER_ID =
  "ocr-pipeline-future-observability-foundation-consumer" as const;

/**
 * Referência estrutural — futuro OCR Pipeline ↔ ExecutionObservabilityPort.
 * Nenhuma integração real. Nenhum log. Nenhuma métrica.
 */
export type OcrPipelineObservabilityFoundationConsumerReference = {
  kind: "ocr-pipeline-observability-foundation-consumer-reference";
  consumerId: typeof OCR_PIPELINE_OBSERVABILITY_FOUNDATION_CONSUMER_ID;
  portContract: "ExecutionObservabilityPort";
  portRef: "ExecutionObservabilityPort";
  schedulerPortContract: "ExecutionSchedulerPort";
  willUseObservabilityFoundationViaPort: true;
  currentlyUsesObservability: false;
  loggingPerformed: false;
  metricsCollected: false;
  tracingPerformed: false;
  eventsTransmitted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  enginesInvoked: false;
  ocrInvoked: false;
  implementsOcr: false;
  realObservabilityBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

/** Constante canônica da referência estrutural OCR → Observability Foundation. */
export const OCR_PIPELINE_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE: OcrPipelineObservabilityFoundationConsumerReference =
  {
    kind: "ocr-pipeline-observability-foundation-consumer-reference",
    consumerId: OCR_PIPELINE_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
    portContract: "ExecutionObservabilityPort",
    portRef: "ExecutionObservabilityPort",
    schedulerPortContract: "ExecutionSchedulerPort",
    willUseObservabilityFoundationViaPort: true,
    currentlyUsesObservability: false,
    loggingPerformed: false,
    metricsCollected: false,
    tracingPerformed: false,
    eventsTransmitted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
    enginesInvoked: false,
    ocrInvoked: false,
    implementsOcr: false,
    realObservabilityBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-04 structural consumer reference — OCR Pipeline will use ExecutionObservabilityPort in the future; OCR does NOT use Observability in this sprint",
  };
