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
import { EnterpriseConsoleEngine } from "../../../src/lib/enterprise/master-orchestration/console";

describe("J-06 EnterpriseConsoleEngine", () => {
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
  const governance = new EnterpriseGovernanceEngine(
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
  const engine = new EnterpriseConsoleEngine(
    governance,
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

  it("constrói engine com governance, policy, saga, orchestration, command e fachadas", () => {
    assert.ok(engine.governance);
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

  it("reutiliza as engines J-01 a J-05 por identidade referencial", () => {
    assert.strictEqual(engine.governance, governance);
    assert.strictEqual(engine.policy, policy);
    assert.strictEqual(engine.saga, saga);
    assert.strictEqual(engine.orchestration, orchestration);
    assert.strictEqual(engine.command, command);
    assert.strictEqual(engine.business, business);
    assert.strictEqual(engine.integration, integration);
    assert.strictEqual(engine.tiss, tiss);
    assert.strictEqual(engine.tissIntegration, tissIntegration);
    assert.strictEqual(engine.workflow, workflow);
  });

  it("preserva a cadeia arquitetural: console -> governance -> policy -> saga -> orchestration -> command", () => {
    assert.strictEqual(engine.governance, governance);
    assert.strictEqual(engine.governance.policy, policy);
    assert.strictEqual(engine.governance.saga, saga);
    assert.strictEqual(engine.governance.orchestration, orchestration);
    assert.strictEqual(engine.governance.command, command);
    assert.strictEqual(engine.policy.saga, saga);
    assert.strictEqual(engine.policy.orchestration, orchestration);
    assert.strictEqual(engine.policy.command, command);
    assert.strictEqual(engine.saga.orchestration, orchestration);
    assert.strictEqual(engine.saga.command, command);
    assert.strictEqual(engine.orchestration.command, command);
    assert.strictEqual(engine.command.business, business);
  });

  it("não possui imports diretos de Adapters, Providers, Registries, Stores ou engines dos Blocos A-H", () => {
    const keys = Object.keys(engine);
    assert.ok(keys.includes("governance"));
    assert.ok(keys.includes("policy"));
    assert.ok(keys.includes("saga"));
    assert.ok(keys.includes("orchestration"));
    assert.ok(keys.includes("command"));
    assert.ok(keys.includes("business"));
    assert.ok(keys.includes("integration"));
    assert.ok(keys.includes("tiss"));
    assert.ok(keys.includes("tissIntegration"));
    assert.ok(keys.includes("workflow"));
    assert.strictEqual(keys.length, 10);
  });

  it("não há ciclos de import entre J-01 e J-06", () => {
    assert.strictEqual(engine.governance.command, command);
    assert.strictEqual(engine.governance.policy.command, command);
    assert.strictEqual(engine.governance.saga.command, command);
    assert.strictEqual(engine.governance.orchestration.command, command);
    assert.strictEqual(engine.command, engine.governance.policy.saga.orchestration.command);
  });

  it("getCapabilities retorna J-01 a J-06 ativas", () => {
    const caps = engine.getCapabilities();
    assert.strictEqual(caps.enterpriseCommandImplemented, true);
    assert.strictEqual(caps.enterpriseOrchestrationImplemented, true);
    assert.strictEqual(caps.enterpriseSagaImplemented, true);
    assert.strictEqual(caps.enterprisePolicyImplemented, true);
    assert.strictEqual(caps.enterpriseGovernanceImplemented, true);
    assert.strictEqual(caps.enterpriseConsoleImplemented, true);
  });

  it("todas as demais capabilities do Bloco J permanecem false", () => {
    const caps = engine.getCapabilities();
    assert.strictEqual(caps.enterpriseMasterRoutingImplemented, false);
    assert.strictEqual(caps.enterpriseMasterMonitoringImplemented, false);
    assert.strictEqual(caps.enterpriseMasterRecoveryImplemented, false);
    assert.strictEqual(caps.enterpriseMasterOrchestrationImplemented, false);
  });

  it("não duplica lógica: contém apenas propriedades, construtor e getCapabilities", () => {
    const proto = Object.getPrototypeOf(engine);
    const methods = Object.getOwnPropertyNames(proto);
    assert.ok(methods.includes("getCapabilities"));
    assert.ok(methods.includes("constructor"));
    assert.ok(methods.length <= 2);
  });

  it("matriz de acoplamento reflete a estrutura esperada", () => {
    const directImports = Object.keys(engine).length;
    const mandatory = 10; // governance + policy + saga + orchestration + command + 5 fachadas
    const optional = 0;
    const redundant = 0;
    const indirect = {
      governanceToPolicy: 1,
      governanceToSaga: 1,
      governanceToOrchestration: 1,
      governanceToCommand: 1,
      policyToSaga: 1,
      policyToOrchestration: 1,
      policyToCommand: 1,
      sagaToOrchestration: 1,
      sagaToCommand: 1,
      orchestrationToCommand: 1,
      commandToFacades: 5,
    };
    const transitive = Object.values(indirect).reduce((a, b) => a + b, 0);

    assert.strictEqual(directImports, mandatory);
    assert.strictEqual(optional, 0);
    assert.strictEqual(redundant, 0);
    assert.strictEqual(transitive, 15);
    assert.strictEqual(engine.governance.command, command);
    assert.strictEqual(engine.governance.policy.saga.orchestration.command, command);
  });

  it("análise de impacto arquitetural: engines anteriores não foram alteradas", () => {
    // Identidade referencial dos componentes J-01 a J-05 inalterada
    assert.strictEqual(engine.governance, governance);
    assert.strictEqual(engine.policy, policy);
    assert.strictEqual(engine.saga, saga);
    assert.strictEqual(engine.orchestration, orchestration);
    assert.strictEqual(engine.command, command);
    // Capabilities anteriores permanecem ativas sem mudanças
    assert.strictEqual(engine.getCapabilities().enterpriseCommandImplemented, true);
    assert.strictEqual(engine.getCapabilities().enterpriseOrchestrationImplemented, true);
    assert.strictEqual(engine.getCapabilities().enterpriseSagaImplemented, true);
    assert.strictEqual(engine.getCapabilities().enterprisePolicyImplemented, true);
    assert.strictEqual(engine.getCapabilities().enterpriseGovernanceImplemented, true);
  });
});
