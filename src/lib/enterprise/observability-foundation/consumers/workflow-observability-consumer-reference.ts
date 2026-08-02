/**
 * Referência estrutural obrigatória — futuro consumidor Workflow (INF-04).
 *
 * O Workflow NÃO utiliza o Observability Foundation nesta sprint.
 */

export const WORKFLOW_OBSERVABILITY_FOUNDATION_CONSUMER_ID =
  "workflow-future-observability-foundation-consumer" as const;

export type WorkflowObservabilityFoundationConsumerReference = {
  kind: "workflow-observability-foundation-consumer-reference";
  consumerId: typeof WORKFLOW_OBSERVABILITY_FOUNDATION_CONSUMER_ID;
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
  workflowInvoked: false;
  implementsWorkflow: false;
  realObservabilityBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

export const WORKFLOW_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE: WorkflowObservabilityFoundationConsumerReference =
  {
    kind: "workflow-observability-foundation-consumer-reference",
    consumerId: WORKFLOW_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
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
    workflowInvoked: false,
    implementsWorkflow: false,
    realObservabilityBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-04 structural consumer reference — Workflow will use ExecutionObservabilityPort in the future; Workflow does NOT use Observability in this sprint",
  };
