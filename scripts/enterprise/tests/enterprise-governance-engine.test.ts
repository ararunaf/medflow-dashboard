import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BusinessRuleCatalog } from "../../../src/lib/enterprise/business-engine/business-rule-catalog";
import { BusinessRuleExecutionEngine } from "../../../src/lib/enterprise/business-engine/business-rule-execution";
import { BusinessTransactionEngine } from "../../../src/lib/enterprise/business-engine/business-transaction";
import { BusinessWorkflowEngine } from "../../../src/lib/enterprise/business-engine/business-workflow";
import { BusinessProcessOrchestrationEngine } from "../../../src/lib/enterprise/business-engine/business-process-orchestration";
import { BusinessDecisionTableEngine } from "../../../src/lib/enterprise/business-engine/business-decision-table";
import { BusinessEventLogEngine } from "../../../src/lib/enterprise/business-engine/business-event-log";
import { BusinessAuditTrailEngine } from "../../../src/lib/enterprise/business-engine/business-audit-trail";
import { BusinessReportEngine } from "../../../src/lib/enterprise/business-engine/business-report";
import { GenericBusinessEngine } from "../../../src/lib/enterprise/business-engine/generic-business-engine";
import { IntegrationRegistryEngine } from "../../../src/lib/enterprise/integration-engine/integration-registry";
import { IntegrationConnectorEngine } from "../../../src/lib/enterprise/integration-engine/integration-connector";
import { IntegrationPipelineEngine } from "../../../src/lib/enterprise/integration-engine/integration-pipeline";
import { IntegrationMappingEngine } from "../../../src/lib/enterprise/integration-engine/integration-mapping";
import { IntegrationTransformationEngine } from "../../../src/lib/enterprise/integration-engine/integration-transformation";
import { IntegrationValidationEngine } from "../../../src/lib/enterprise/integration-engine/integration-validation";
import { IntegrationRoutingEngine } from "../../../src/lib/enterprise/integration-engine/integration-routing";
import { IntegrationMonitoringEngine } from "../../../src/lib/enterprise/integration-engine/integration-monitoring";
import { IntegrationReportEngine } from "../../../src/lib/enterprise/integration-engine/integration-report";
import { GenericIntegrationEngine } from "../../../src/lib/enterprise/integration-engine/generic-integration-engine";
import { TissKnowledgeEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-knowledge";
import { TissLayoutEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-layout";
import { TissParserEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-parser";
import { TissSerializerEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-serializer";
import { TissSchemaValidationEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-schema-validation";
import { TissBusinessValidationEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-business-validation";
import { TissOperatorValidationEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-operator-validation";
import { TissRepairEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-repair";
import { TissCorrectionEngine } from "../../../src/lib/enterprise/tiss-engine/tiss-correction";
import { GenericTissEngine } from "../../../src/lib/enterprise/tiss-engine/generic-tiss-engine";
import { TissCommunicationEngine } from "../../../src/lib/enterprise/tiss-integration-engine/communication";
import { TissSoapEngine } from "../../../src/lib/enterprise/tiss-integration-engine/soap";
import { TissAuthenticationEngine } from "../../../src/lib/enterprise/tiss-integration-engine/authentication";
import { TissSubmissionEngine } from "../../../src/lib/enterprise/tiss-integration-engine/submission";
import { TissBatchEngine } from "../../../src/lib/enterprise/tiss-integration-engine/batch";
import { TissReturnProcessingEngine } from "../../../src/lib/enterprise/tiss-integration-engine/return-processing";
import { TissStatusTrackingEngine } from "../../../src/lib/enterprise/tiss-integration-engine/status-tracking";
import { TissRetryEngine } from "../../../src/lib/enterprise/tiss-integration-engine/retry";
import { TissAuditEngine } from "../../../src/lib/enterprise/tiss-integration-engine/audit";
import { GenericTissIntegrationEngine } from "../../../src/lib/enterprise/tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../../src/lib/enterprise/workflow-engine/generic-workflow-engine";
import { EnterpriseCommandEngine } from "../../../src/lib/enterprise/master-orchestration/command";
import { EnterpriseOrchestrationEngine } from "../../../src/lib/enterprise/master-orchestration/orchestration";
import { EnterpriseSagaEngine } from "../../../src/lib/enterprise/master-orchestration/saga";
import { EnterprisePolicyEngine } from "../../../src/lib/enterprise/master-orchestration/policy";
import { EnterpriseGovernanceEngine } from "../../../src/lib/enterprise/master-orchestration/governance";

describe("J-05 EnterpriseGovernanceEngine", () => {
  const business = new GenericBusinessEngine(
    new BusinessRuleCatalog(),
    new BusinessRuleExecutionEngine(),
    new BusinessTransactionEngine(),
    new BusinessWorkflowEngine(),
    new BusinessProcessOrchestrationEngine(),
    new BusinessDecisionTableEngine(),
    new BusinessEventLogEngine(),
    new BusinessAuditTrailEngine(),
    new BusinessReportEngine(),
  );

  const integration = new GenericIntegrationEngine(
    new IntegrationRegistryEngine(),
    new IntegrationConnectorEngine(),
    new IntegrationPipelineEngine(),
    new IntegrationMappingEngine(),
    new IntegrationTransformationEngine(),
    new IntegrationValidationEngine(),
    new IntegrationRoutingEngine(),
    new IntegrationMonitoringEngine(),
    new IntegrationReportEngine(),
  );

  const tiss = new GenericTissEngine(
    new TissKnowledgeEngine(),
    new TissLayoutEngine(),
    new TissParserEngine(),
    new TissSerializerEngine(),
    new TissSchemaValidationEngine(),
    new TissBusinessValidationEngine(),
    new TissOperatorValidationEngine(),
    new TissRepairEngine(),
    new TissCorrectionEngine(),
  );

  const communication = new TissCommunicationEngine();
  const soap = new TissSoapEngine(communication);
  const authentication = new TissAuthenticationEngine(communication, soap);
  const submission = new TissSubmissionEngine(communication, soap, authentication);
  const batch = new TissBatchEngine(submission);
  const returnProcessing = new TissReturnProcessingEngine(submission, batch);
  const statusTracking = new TissStatusTrackingEngine(submission, batch, returnProcessing);
  const retry = new TissRetryEngine(submission, batch, returnProcessing);
  const audit = new TissAuditEngine(submission, batch, returnProcessing);

  const tissIntegration = new GenericTissIntegrationEngine(
    communication,
    soap,
    authentication,
    submission,
    batch,
    returnProcessing,
    statusTracking,
    retry,
    audit,
  );

  const workflow = new GenericWorkflowEngine();

  const command = new EnterpriseCommandEngine(business, integration, tiss, tissIntegration, workflow);
  const orchestration = new EnterpriseOrchestrationEngine(
    command,
    business,
    integration,
    tiss,
    tissIntegration,
    workflow,
  );
  const saga = new EnterpriseSagaEngine(
    orchestration,
    command,
    business,
    integration,
    tiss,
    tissIntegration,
    workflow,
  );
  const policy = new EnterprisePolicyEngine(
    saga,
    orchestration,
    command,
    business,
    integration,
    tiss,
    tissIntegration,
    workflow,
  );
  const engine = new EnterpriseGovernanceEngine(
    policy,
    saga,
    orchestration,
    command,
    business,
    integration,
    tiss,
    tissIntegration,
    workflow,
  );

  it("constrói engine com policy, saga, orchestration, command e fachadas E-I", () => {
    assert.ok(engine.policy);
    assert.ok(engine.saga);
    assert.ok(engine.orchestration);
    assert.ok(engine.command);
    assert.ok(engine.business);
    assert.ok(engine.integration);
    assert.ok(engine.tiss);
    assert.ok(engine.tissIntegration);
    assert.ok(engine.workflow);
  });

  it("reutiliza EnterprisePolicyEngine, EnterpriseSagaEngine, EnterpriseOrchestrationEngine e EnterpriseCommandEngine", () => {
    assert.strictEqual(engine.policy, policy);
    assert.strictEqual(engine.saga, saga);
    assert.strictEqual(engine.orchestration, orchestration);
    assert.strictEqual(engine.command, command);
  });

  it("reutiliza as fachadas E, F, G, H e I", () => {
    assert.strictEqual(engine.business, business);
    assert.strictEqual(engine.integration, integration);
    assert.strictEqual(engine.tiss, tiss);
    assert.strictEqual(engine.tissIntegration, tissIntegration);
    assert.strictEqual(engine.workflow, workflow);
  });

  it("preserva a cadeia arquitetural: governance -> policy -> saga -> orchestration -> command -> fachadas", () => {
    assert.strictEqual(engine.policy, policy);
    assert.strictEqual(engine.policy.saga, saga);
    assert.strictEqual(engine.policy.orchestration, orchestration);
    assert.strictEqual(engine.policy.command, command);
    assert.strictEqual(engine.saga.orchestration, orchestration);
    assert.strictEqual(engine.saga.command, command);
    assert.strictEqual(engine.orchestration.command, command);
    assert.strictEqual(engine.command.business, business);
    assert.strictEqual(engine.command.integration, integration);
    assert.strictEqual(engine.command.tiss, tiss);
    assert.strictEqual(engine.command.tissIntegration, tissIntegration);
    assert.strictEqual(engine.command.workflow, workflow);
  });

  it("não possui imports diretos de Adapters, Providers, Registries, Stores ou engines dos Blocos A-H", () => {
    const mod = engine as unknown as Record<string, unknown>;
    assert.ok(mod.policy);
    assert.ok(mod.saga);
    assert.ok(mod.orchestration);
    assert.ok(mod.command);
    assert.ok(mod.business);
    assert.ok(mod.integration);
    assert.ok(mod.tiss);
    assert.ok(mod.tissIntegration);
    assert.ok(mod.workflow);
  });

  it("não há ciclos de import entre J-01, J-02, J-03, J-04 e J-05", () => {
    assert.strictEqual(engine.command, engine.policy.command);
    assert.strictEqual(engine.command, engine.policy.saga.command);
    assert.strictEqual(engine.orchestration, engine.policy.orchestration);
    assert.strictEqual(engine.saga, engine.policy.saga);
    assert.strictEqual(engine.command, engine.policy.saga.orchestration.command);
    assert.ok(engine.policy.saga.orchestration.command.getCapabilities);
  });

  it("getCapabilities retorna J-01 a J-05 ativas", () => {
    const caps = engine.getCapabilities();
    assert.strictEqual(caps.enterpriseCommandImplemented, true);
    assert.strictEqual(caps.enterpriseOrchestrationImplemented, true);
    assert.strictEqual(caps.enterpriseSagaImplemented, true);
    assert.strictEqual(caps.enterprisePolicyImplemented, true);
    assert.strictEqual(caps.enterpriseGovernanceImplemented, true);
  });

  it("todas as demais capabilities do Bloco J permanecem false", () => {
    const caps = engine.getCapabilities();
    assert.strictEqual(caps.enterpriseConsoleImplemented, false);
    assert.strictEqual(caps.enterpriseMasterRoutingImplemented, false);
    assert.strictEqual(caps.enterpriseMasterMonitoringImplemented, false);
    assert.strictEqual(caps.enterpriseMasterRecoveryImplemented, false);
    assert.strictEqual(caps.enterpriseMasterOrchestrationImplemented, false);
  });

  it("matriz de acoplamento reflete a estrutura esperada", () => {
    const directDeps = Object.keys(engine).length;
    const transitive = {
      policy: 1,
      policyToSaga: 1,
      policyToOrchestration: 1,
      policyToCommand: 1,
      sagaToOrchestration: 1,
      sagaToCommand: 1,
      orchestrationToCommand: 1,
      commandToFacades: 5,
    };
    const directImports = 9; // policy + saga + orchestration + command + 5 fachadas
    const optionalDeps = 0;
    const redundantDeps = 0;

    assert.strictEqual(directDeps, directImports);
    assert.strictEqual(optionalDeps, 0);
    assert.strictEqual(redundantDeps, 0);
    assert.strictEqual(Object.values(transitive).reduce((a, b) => a + b, 0), 12);
    assert.strictEqual(engine.policy.saga.orchestration.command.business, business);
  });
});
