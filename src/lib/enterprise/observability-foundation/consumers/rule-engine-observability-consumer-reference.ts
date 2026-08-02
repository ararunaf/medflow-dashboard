/**
 * Referência estrutural obrigatória — futuro consumidor Rule Engine (INF-04).
 *
 * O Rule Engine NÃO utiliza o Observability Foundation nesta sprint.
 */

export const RULE_ENGINE_OBSERVABILITY_FOUNDATION_CONSUMER_ID =
  "rule-engine-future-observability-foundation-consumer" as const;

export type RuleEngineObservabilityFoundationConsumerReference = {
  kind: "rule-engine-observability-foundation-consumer-reference";
  consumerId: typeof RULE_ENGINE_OBSERVABILITY_FOUNDATION_CONSUMER_ID;
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
  ruleEngineInvoked: false;
  implementsRuleEngine: false;
  realObservabilityBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

export const RULE_ENGINE_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE: RuleEngineObservabilityFoundationConsumerReference =
  {
    kind: "rule-engine-observability-foundation-consumer-reference",
    consumerId: RULE_ENGINE_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
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
    ruleEngineInvoked: false,
    implementsRuleEngine: false,
    realObservabilityBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-04 structural consumer reference — Rule Engine will use ExecutionObservabilityPort in the future; Rule Engine does NOT use Observability in this sprint",
  };
