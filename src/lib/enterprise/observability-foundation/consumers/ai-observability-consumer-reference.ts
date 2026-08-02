/**
 * Referência estrutural obrigatória — futuro consumidor IA (INF-04).
 *
 * A IA NÃO utiliza o Observability Foundation nesta sprint.
 */

export const AI_OBSERVABILITY_FOUNDATION_CONSUMER_ID =
  "ai-future-observability-foundation-consumer" as const;

export type AiObservabilityFoundationConsumerReference = {
  kind: "ai-observability-foundation-consumer-reference";
  consumerId: typeof AI_OBSERVABILITY_FOUNDATION_CONSUMER_ID;
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
  aiInvoked: false;
  implementsAi: false;
  realObservabilityBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

export const AI_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE: AiObservabilityFoundationConsumerReference =
  {
    kind: "ai-observability-foundation-consumer-reference",
    consumerId: AI_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
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
    aiInvoked: false,
    implementsAi: false,
    realObservabilityBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-04 structural consumer reference — AI will use ExecutionObservabilityPort in the future; AI does NOT use Observability in this sprint",
  };
