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
import { EnterpriseMasterRoutingEngine } from "../../../src/lib/enterprise/master-orchestration/routing";
import { EnterpriseMasterMonitoringEngine } from "../../../src/lib/enterprise/master-orchestration/monitoring";
import { EnterpriseMasterRecoveryEngine } from "../../../src/lib/enterprise/master-orchestration/recovery";
import { EnterpriseMasterOrchestrationEngine } from "../../../src/lib/enterprise/master-orchestration/master";
import { EnterpriseTissVocabularyDiscoveryEngine } from "../../../src/lib/enterprise/tiss-intelligence/vocabulary-discovery";
import { EnterpriseTissVocabularyCanonicalEngine } from "../../../src/lib/enterprise/tiss-intelligence/vocabulary-canonical";
import { EnterpriseTissVocabularyRegistryEngine } from "../../../src/lib/enterprise/tiss-intelligence/vocabulary-registry";
import { EnterpriseTissVocabularyQueryEngine } from "../../../src/lib/enterprise/tiss-intelligence/vocabulary-query";
import { EnterpriseGenericTissVocabularyEngine } from "../../../src/lib/enterprise/tiss-intelligence/generic-vocabulary";
import { EnterpriseTissMappingDiscoveryEngine } from "../../../src/lib/enterprise/tiss-mapping/mapping-discovery";
import { EnterpriseTissMappingCanonicalEngine } from "../../../src/lib/enterprise/tiss-mapping/mapping-canonical";
import {
  TissMappingRule,
  TissMappingRelation,
  TissMappingTarget,
  TissMappingSource,
  TissMappingContext,
  TissMappingDomain,
} from "../../../src/lib/enterprise/tiss-mapping/mapping-canonical";

describe("EPC-21B EnterpriseTissMappingCanonicalEngine", () => {
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
  const consoleEngine = new EnterpriseConsoleEngine(
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
  const masterRouting = new EnterpriseMasterRoutingEngine(
    consoleEngine,
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
  const masterMonitoring = new EnterpriseMasterMonitoringEngine(
    masterRouting,
    consoleEngine,
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
  const masterRecovery = new EnterpriseMasterRecoveryEngine(
    masterMonitoring,
    masterRouting,
    consoleEngine,
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
  const masterOrchestration = new EnterpriseMasterOrchestrationEngine(
    masterRecovery,
    masterMonitoring,
    masterRouting,
    consoleEngine,
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

  const vocabularyDiscovery = new EnterpriseTissVocabularyDiscoveryEngine(
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const vocabularyCanonical = new EnterpriseTissVocabularyCanonicalEngine(
    vocabularyDiscovery,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const vocabularyRegistry = new EnterpriseTissVocabularyRegistryEngine(
    vocabularyCanonical,
    vocabularyDiscovery,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const vocabularyQuery = new EnterpriseTissVocabularyQueryEngine(
    vocabularyRegistry,
    vocabularyCanonical,
    vocabularyDiscovery,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const genericVocabulary = new EnterpriseGenericTissVocabularyEngine(
    vocabularyQuery,
    vocabularyRegistry,
    vocabularyCanonical,
    vocabularyDiscovery,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const discovery = new EnterpriseTissMappingDiscoveryEngine(
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const engine = new EnterpriseTissMappingCanonicalEngine(
    discovery,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );

  it("constroi engine com as seis engines Enterprise", () => {
    assert.ok(engine.discoveryEngine);
    assert.ok(engine.genericVocabularyEngine);
    assert.ok(engine.genericTissEngine);
    assert.ok(engine.genericTissIntegrationEngine);
    assert.ok(engine.workflowEngine);
    assert.ok(engine.masterOrchestrationEngine);
  });

  it("reutiliza engines anteriores por identidade referencial", () => {
    assert.strictEqual(engine.discoveryEngine, discovery);
    assert.strictEqual(engine.genericVocabularyEngine, genericVocabulary);
    assert.strictEqual(engine.genericTissEngine, tiss);
    assert.strictEqual(engine.genericTissIntegrationEngine, tissIntegration);
    assert.strictEqual(engine.workflowEngine, workflow);
    assert.strictEqual(engine.masterOrchestrationEngine, masterOrchestration);
  });

  it("contem apenas seis propriedades readonly, construtor e getCapabilities", () => {
    const keys = Object.keys(engine);
    assert.strictEqual(keys.length, 6);
    assert.ok(keys.includes("discoveryEngine"));
    assert.ok(keys.includes("genericVocabularyEngine"));
    assert.ok(keys.includes("genericTissEngine"));
    assert.ok(keys.includes("genericTissIntegrationEngine"));
    assert.ok(keys.includes("workflowEngine"));
    assert.ok(keys.includes("masterOrchestrationEngine"));
  });

  it("getCapabilities ativa discovery e canonical, mantem demais false", () => {
    const caps = engine.getCapabilities();
    assert.strictEqual(caps.tissMappingDiscoveryImplemented, true);
    assert.strictEqual(caps.tissMappingCanonicalModelImplemented, true);
    assert.strictEqual(caps.tissMappingRegistryImplemented, false);
    assert.strictEqual(caps.tissMappingQueryEngineImplemented, false);
    assert.strictEqual(caps.tissGenericMappingEngineImplemented, false);
  });

  it("nao possui logica funcional: getCapabilities eh o unico metodo", () => {
    const proto = Object.getPrototypeOf(engine);
    const methods = Object.getOwnPropertyNames(proto);
    assert.ok(methods.includes("constructor"));
    assert.ok(methods.includes("getCapabilities"));
    assert.ok(methods.length <= 2);
  });

  it("modelos canonicos possuem apenas propriedades readonly", () => {
    const rule = new TissMappingRule(
      "r-1",
      "procedimento-para-guia",
      "procedimento",
      "guia",
      "relaciona",
      "1.0.0",
      "2026-08-10",
      null,
    );
    assert.strictEqual(rule.ruleId, "r-1");
    assert.strictEqual(rule.name, "procedimento-para-guia");
    assert.strictEqual(rule.sourceDomain, "procedimento");
    assert.strictEqual(rule.targetDomain, "guia");
    assert.strictEqual(rule.relationType, "relaciona");

    const relation = new TissMappingRelation("rel-1", "para", "Descrição", "1:1");
    assert.strictEqual(relation.relationId, "rel-1");
    assert.strictEqual(relation.name, "para");

    const target = new TissMappingTarget("t-1", "COD_001", "Procedimento X", "guia");
    assert.strictEqual(target.targetId, "t-1");
    assert.strictEqual(target.code, "COD_001");

    const source = new TissMappingSource("s-1", "COD_001", "Procedimento X", "procedimento");
    assert.strictEqual(source.sourceId, "s-1");
    assert.strictEqual(source.code, "COD_001");

    const context = new TissMappingContext("ctx-1", "Ambulatorial", "3.0.0", "operadora");
    assert.strictEqual(context.contextId, "ctx-1");
    assert.strictEqual(context.name, "Ambulatorial");

    const domain = new TissMappingDomain("dom-1", "Guias", "3.0.0", [rule]);
    assert.strictEqual(domain.domainId, "dom-1");
    assert.strictEqual(domain.rules.length, 1);
    assert.strictEqual(domain.rules[0].ruleId, "r-1");
  });
});
