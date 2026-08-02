/**
 * Referência estrutural obrigatória — futuro consumidor Importação (INF-04).
 *
 * A Importação NÃO utiliza o Observability Foundation nesta sprint.
 */

export const IMPORTACAO_OBSERVABILITY_FOUNDATION_CONSUMER_ID =
  "importacao-future-observability-foundation-consumer" as const;

export type ImportacaoObservabilityFoundationConsumerReference = {
  kind: "importacao-observability-foundation-consumer-reference";
  consumerId: typeof IMPORTACAO_OBSERVABILITY_FOUNDATION_CONSUMER_ID;
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
  importacaoInvoked: false;
  implementsImportacao: false;
  realObservabilityBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

export const IMPORTACAO_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE: ImportacaoObservabilityFoundationConsumerReference =
  {
    kind: "importacao-observability-foundation-consumer-reference",
    consumerId: IMPORTACAO_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
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
    importacaoInvoked: false,
    implementsImportacao: false,
    realObservabilityBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-04 structural consumer reference — Importação will use ExecutionObservabilityPort in the future; Importação does NOT use Observability in this sprint",
  };
