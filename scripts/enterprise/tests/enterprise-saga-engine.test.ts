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

describe("J-03 EnterpriseSagaEngine", () => {
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
  const engine = new EnterpriseSagaEngine(
    orchestration,
    command,
    business,
    integration,
    tiss,
    tissIntegration,
    workflow,
  );

  it("constrói engine com EnterpriseOrchestrationEngine, EnterpriseCommandEngine e fachadas", () => {
    assert.ok(engine.orchestration);
    assert.ok(engine.command);
    assert.ok(engine.business);
    assert.ok(engine.integration);
    assert.ok(engine.tiss);
    assert.ok(engine.tissIntegration);
    assert.ok(engine.workflow);
  });

  it("reutiliza EnterpriseOrchestrationEngine", () => {
    assert.strictEqual(engine.orchestration, orchestration);
    assert.ok(engine.orchestration.getCapabilities);
  });

  it("reutiliza EnterpriseCommandEngine", () => {
    assert.strictEqual(engine.command, command);
    assert.ok(engine.command.getCapabilities);
  });

  it("reutiliza GenericBusinessEngine", () => {
    assert.strictEqual(engine.business, business);
    assert.ok(engine.business.ruleCatalog);
  });

  it("reutiliza GenericIntegrationEngine", () => {
    assert.strictEqual(engine.integration, integration);
    assert.ok(engine.integration.registry);
  });

  it("reutiliza GenericTissEngine", () => {
    assert.strictEqual(engine.tiss, tiss);
    assert.ok(engine.tiss.knowledge);
  });

  it("reutiliza GenericTissIntegrationEngine", () => {
    assert.strictEqual(engine.tissIntegration, tissIntegration);
    assert.ok(engine.tissIntegration.communication);
  });

  it("reutiliza GenericWorkflowEngine", () => {
    assert.strictEqual(engine.workflow, workflow);
    assert.ok(engine.workflow.workflow);
  });

  it("preserva a cadeia arquitetural: saga -> orchestration -> command -> fachadas", () => {
    assert.strictEqual(engine.orchestration.command, command);
    assert.strictEqual(engine.orchestration.business, business);
    assert.strictEqual(engine.command.business, business);
    assert.strictEqual(engine.command.integration, integration);
    assert.strictEqual(engine.command.tiss, tiss);
    assert.strictEqual(engine.command.tissIntegration, tissIntegration);
    assert.strictEqual(engine.command.workflow, workflow);
  });

  it("getCapabilities retorna enterpriseCommandImplemented, enterpriseOrchestrationImplemented e enterpriseSagaImplemented = true", () => {
    const caps = engine.getCapabilities();
    assert.strictEqual(caps.enterpriseCommandImplemented, true);
    assert.strictEqual(caps.enterpriseOrchestrationImplemented, true);
    assert.strictEqual(caps.enterpriseSagaImplemented, true);
  });

  it("todas as demais capabilities do Bloco J permanecem false", () => {
    const caps = engine.getCapabilities();
    assert.strictEqual(caps.enterprisePolicyImplemented, false);
    assert.strictEqual(caps.enterpriseGovernanceImplemented, false);
    assert.strictEqual(caps.enterpriseConsoleImplemented, false);
    assert.strictEqual(caps.enterpriseMasterRoutingImplemented, false);
    assert.strictEqual(caps.enterpriseMasterMonitoringImplemented, false);
    assert.strictEqual(caps.enterpriseMasterRecoveryImplemented, false);
    assert.strictEqual(caps.enterpriseMasterOrchestrationImplemented, false);
  });
});
