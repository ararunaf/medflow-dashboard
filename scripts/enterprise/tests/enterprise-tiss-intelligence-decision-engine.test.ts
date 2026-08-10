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
import { EnterpriseTissMappingRegistryEngine } from "../../../src/lib/enterprise/tiss-mapping/mapping-registry";
import { EnterpriseTissMappingQueryEngine } from "../../../src/lib/enterprise/tiss-mapping/mapping-query";
import { EnterpriseGenericTissMappingEngine } from "../../../src/lib/enterprise/tiss-mapping/generic-mapping";
import { EnterpriseTissIntelligenceDiscoveryEngine } from "../../../src/lib/enterprise/tiss-intelligence-engine/intelligence-discovery";
import { EnterpriseTissIntelligenceCanonicalEngine } from "../../../src/lib/enterprise/tiss-intelligence-engine/intelligence-canonical";
import { EnterpriseTissIntelligenceRegistryEngine } from "../../../src/lib/enterprise/tiss-intelligence-engine/intelligence-registry";
import { EnterpriseTissIntelligenceDecisionEngine } from "../../../src/lib/enterprise/tiss-intelligence-engine/intelligence-decision";

describe("EPC-22D EnterpriseTissIntelligenceDecisionEngine", () => {
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
  const mappingDiscovery = new EnterpriseTissMappingDiscoveryEngine(
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const mappingCanonical = new EnterpriseTissMappingCanonicalEngine(
    mappingDiscovery,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const mappingRegistry = new EnterpriseTissMappingRegistryEngine(
    mappingCanonical,
    mappingDiscovery,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const mappingQuery = new EnterpriseTissMappingQueryEngine(
    mappingRegistry,
    mappingCanonical,
    mappingDiscovery,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const genericMapping = new EnterpriseGenericTissMappingEngine(
    mappingQuery,
    mappingRegistry,
    mappingCanonical,
    mappingDiscovery,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const intelligenceDiscovery = new EnterpriseTissIntelligenceDiscoveryEngine(
    genericMapping,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const intelligenceCanonical = new EnterpriseTissIntelligenceCanonicalEngine(
    intelligenceDiscovery,
    genericMapping,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const intelligenceRegistry = new EnterpriseTissIntelligenceRegistryEngine(
    intelligenceCanonical,
    intelligenceDiscovery,
    genericMapping,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );
  const intelligenceDecision = new EnterpriseTissIntelligenceDecisionEngine(
    intelligenceRegistry,
    intelligenceCanonical,
    intelligenceDiscovery,
    genericMapping,
    genericVocabulary,
    tiss,
    tissIntegration,
    workflow,
    masterOrchestration,
  );

  it("constroi engine com as nove engines Enterprise autorizadas", () => {
    assert.ok(intelligenceDecision.registryEngine);
    assert.ok(intelligenceDecision.canonicalEngine);
    assert.ok(intelligenceDecision.discoveryEngine);
    assert.ok(intelligenceDecision.genericMappingEngine);
    assert.ok(intelligenceDecision.genericVocabularyEngine);
    assert.ok(intelligenceDecision.genericTissEngine);
    assert.ok(intelligenceDecision.genericTissIntegrationEngine);
    assert.ok(intelligenceDecision.workflowEngine);
    assert.ok(intelligenceDecision.masterOrchestrationEngine);
  });

  it("reutiliza engines anteriores por identidade referencial", () => {
    assert.strictEqual(intelligenceDecision.registryEngine, intelligenceRegistry);
    assert.strictEqual(intelligenceDecision.canonicalEngine, intelligenceCanonical);
    assert.strictEqual(intelligenceDecision.discoveryEngine, intelligenceDiscovery);
    assert.strictEqual(intelligenceDecision.genericMappingEngine, genericMapping);
    assert.strictEqual(intelligenceDecision.genericVocabularyEngine, genericVocabulary);
    assert.strictEqual(intelligenceDecision.genericTissEngine, tiss);
    assert.strictEqual(intelligenceDecision.genericTissIntegrationEngine, tissIntegration);
    assert.strictEqual(intelligenceDecision.workflowEngine, workflow);
    assert.strictEqual(intelligenceDecision.masterOrchestrationEngine, masterOrchestration);
  });

  it("contem apenas nove propriedades readonly, construtor e getCapabilities", () => {
    const keys = Object.keys(intelligenceDecision);
    assert.strictEqual(keys.length, 9);
    assert.ok(keys.includes("registryEngine"));
    assert.ok(keys.includes("canonicalEngine"));
    assert.ok(keys.includes("discoveryEngine"));
    assert.ok(keys.includes("genericMappingEngine"));
    assert.ok(keys.includes("genericVocabularyEngine"));
    assert.ok(keys.includes("genericTissEngine"));
    assert.ok(keys.includes("genericTissIntegrationEngine"));
    assert.ok(keys.includes("workflowEngine"));
    assert.ok(keys.includes("masterOrchestrationEngine"));
  });

  it("getCapabilities ativa Discovery, Canonical, Registry e Decision", () => {
    const caps = intelligenceDecision.getCapabilities();
    assert.strictEqual(caps.tissIntelligenceDiscoveryImplemented, true);
    assert.strictEqual(caps.tissIntelligenceCanonicalModelImplemented, true);
    assert.strictEqual(caps.tissIntelligenceRegistryImplemented, true);
    assert.strictEqual(caps.tissIntelligenceDecisionEngineImplemented, true);
    assert.strictEqual(caps.tissGenericIntelligenceEngineImplemented, false);
  });

  it("nao possui logica funcional: getCapabilities eh o unico metodo", () => {
    const proto = Object.getPrototypeOf(intelligenceDecision);
    const methods = Object.getOwnPropertyNames(proto);
    assert.ok(methods.includes("constructor"));
    assert.ok(methods.includes("getCapabilities"));
    assert.ok(methods.length <= 2);
  });

  it("nao implementa metodos proibidos de IA, regras, decisao, inferencia, parser", () => {
    const keys = Object.keys(intelligenceDecision);
    for (const k of [
      "store",
      "cache",
      "index",
      "find",
      "search",
      "query",
      "execute",
      "run",
      "decide",
      "recommend",
      "explain",
      "infer",
      "evaluate",
      "validate",
      "score",
      "rule",
    ]) {
      assert.ok(!keys.includes(k), `propriedade proibida encontrada: ${k}`);
    }
  });

  it("consome apenas Registry, Canonical, Discovery e os Gateways oficiais", () => {
    assert.ok(intelligenceDecision.registryEngine);
    assert.ok(intelligenceDecision.canonicalEngine);
    assert.ok(intelligenceDecision.discoveryEngine);
    assert.ok(intelligenceDecision.genericMappingEngine);
    assert.ok(intelligenceDecision.genericVocabularyEngine);
  });
});
