/**
 * Referência estrutural obrigatória — futuro consumidor TISS (INF-04).
 *
 * O TISS NÃO utiliza o Observability Foundation nesta sprint.
 */

export const TISS_OBSERVABILITY_FOUNDATION_CONSUMER_ID =
  "tiss-future-observability-foundation-consumer" as const;

export type TissObservabilityFoundationConsumerReference = {
  kind: "tiss-observability-foundation-consumer-reference";
  consumerId: typeof TISS_OBSERVABILITY_FOUNDATION_CONSUMER_ID;
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
  tissInvoked: false;
  implementsTiss: false;
  realObservabilityBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

export const TISS_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE: TissObservabilityFoundationConsumerReference =
  {
    kind: "tiss-observability-foundation-consumer-reference",
    consumerId: TISS_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
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
    tissInvoked: false,
    implementsTiss: false,
    realObservabilityBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-04 structural consumer reference — TISS will use ExecutionObservabilityPort in the future; TISS does NOT use Observability in this sprint",
  };
