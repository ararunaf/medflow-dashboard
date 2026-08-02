/**
 * Referência estrutural obrigatória — futuro consumidor Auditoria (INF-04).
 *
 * A Auditoria NÃO utiliza o Observability Foundation nesta sprint.
 */

export const AUDITORIA_OBSERVABILITY_FOUNDATION_CONSUMER_ID =
  "auditoria-future-observability-foundation-consumer" as const;

export type AuditoriaObservabilityFoundationConsumerReference = {
  kind: "auditoria-observability-foundation-consumer-reference";
  consumerId: typeof AUDITORIA_OBSERVABILITY_FOUNDATION_CONSUMER_ID;
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
  auditoriaInvoked: false;
  implementsAuditoria: false;
  realObservabilityBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

export const AUDITORIA_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE: AuditoriaObservabilityFoundationConsumerReference =
  {
    kind: "auditoria-observability-foundation-consumer-reference",
    consumerId: AUDITORIA_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
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
    auditoriaInvoked: false,
    implementsAuditoria: false,
    realObservabilityBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-04 structural consumer reference — Auditoria will use ExecutionObservabilityPort in the future; Auditoria does NOT use Observability in this sprint",
  };
