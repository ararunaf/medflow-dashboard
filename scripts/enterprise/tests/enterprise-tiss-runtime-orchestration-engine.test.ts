import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { GenericTissEngine } from "../../../src/lib/enterprise/tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../../src/lib/enterprise/tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../../src/lib/enterprise/workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../../src/lib/enterprise/master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../../src/lib/enterprise/tiss-intelligence/generic-vocabulary";
import { EnterpriseGenericTissMappingEngine } from "../../../src/lib/enterprise/tiss-mapping/generic-mapping";
import { EnterpriseGenericTissIntelligenceEngine } from "../../../src/lib/enterprise/tiss-intelligence-engine/generic-intelligence";
import { EnterpriseTissRuntimeDiscoveryEngine } from "../../../src/lib/enterprise/tiss-runtime/runtime-discovery";
import { EnterpriseTissRuntimeCanonicalEngine } from "../../../src/lib/enterprise/tiss-runtime/runtime-canonical";
import { EnterpriseTissRuntimeRegistryEngine } from "../../../src/lib/enterprise/tiss-runtime/runtime-registry";
import { EnterpriseTissRuntimeOrchestrationEngine } from "../../../src/lib/enterprise/tiss-runtime/runtime-orchestration";
import { EPC23D_TISS_RUNTIME_ORCHESTRATION_CAPABILITIES } from "../../../src/lib/enterprise/tiss-runtime/ports/capabilities";

const sourcePath = fileURLToPath(
  new URL(
    "../../../src/lib/enterprise/tiss-runtime/runtime-orchestration/enterprise-tiss-runtime-orchestration-engine.ts",
    import.meta.url,
  ),
);

describe("EPC-23D EnterpriseTissRuntimeOrchestrationEngine", () => {
  const genericTiss = {} as unknown as GenericTissEngine;
  const genericIntegration = {} as unknown as GenericTissIntegrationEngine;
  const workflow = {} as unknown as GenericWorkflowEngine;
  const master = {} as unknown as EnterpriseMasterOrchestrationEngine;
  const vocabulary = {} as unknown as EnterpriseGenericTissVocabularyEngine;
  const mapping = {} as unknown as EnterpriseGenericTissMappingEngine;
  const intelligence = {} as unknown as EnterpriseGenericTissIntelligenceEngine;

  const discoveryEngine = new EnterpriseTissRuntimeDiscoveryEngine(
    intelligence,
    mapping,
    vocabulary,
    genericTiss,
    genericIntegration,
    workflow,
    master,
  );

  const canonicalEngine = new EnterpriseTissRuntimeCanonicalEngine(
    discoveryEngine,
    intelligence,
    mapping,
    vocabulary,
    genericTiss,
    genericIntegration,
    workflow,
    master,
  );

  const registryEngine = new EnterpriseTissRuntimeRegistryEngine(
    discoveryEngine,
    canonicalEngine,
    intelligence,
    mapping,
    vocabulary,
    genericTiss,
    genericIntegration,
    workflow,
    master,
  );

  const orchestrationEngine = new EnterpriseTissRuntimeOrchestrationEngine(
    discoveryEngine,
    canonicalEngine,
    registryEngine,
    intelligence,
    mapping,
    vocabulary,
    genericTiss,
    genericIntegration,
    workflow,
    master,
  );

  it("construção da engine", () => {
    assert.ok(orchestrationEngine);
    assert.equal(orchestrationEngine.discoveryEngine, discoveryEngine);
    assert.equal(orchestrationEngine.canonicalEngine, canonicalEngine);
    assert.equal(orchestrationEngine.registryEngine, registryEngine);
    assert.ok(orchestrationEngine.genericIntelligenceEngine);
    assert.ok(orchestrationEngine.genericMappingEngine);
    assert.ok(orchestrationEngine.genericVocabularyEngine);
    assert.ok(orchestrationEngine.genericTissEngine);
    assert.ok(orchestrationEngine.genericTissIntegrationEngine);
    assert.ok(orchestrationEngine.workflowEngine);
    assert.ok(orchestrationEngine.masterOrchestrationEngine);
  });

  it("getCapabilities() retorna as capacidades corretas", () => {
    const capabilities = orchestrationEngine.getCapabilities();
    assert.equal(
      capabilities,
      EPC23D_TISS_RUNTIME_ORCHESTRATION_CAPABILITIES,
      "getCapabilities deve retornar o objeto canônico EPC23D",
    );
  });

  it("somente tissRuntimeOrchestrationImplemented = true", () => {
    const caps = orchestrationEngine.getCapabilities();
    assert.strictEqual(caps.tissRuntimeDiscoveryImplemented, true);
    assert.strictEqual(caps.tissRuntimeCanonicalModelImplemented, true);
    assert.strictEqual(caps.tissRuntimeRegistryImplemented, true);
    assert.strictEqual(caps.tissRuntimeOrchestrationImplemented, true);
    assert.strictEqual(caps.tissGenericRuntimeEngineImplemented, false);
  });

  it("módulo não importa engines internas de Vocabulary, Mapping ou Intelligence", () => {
    const source = readFileSync(sourcePath, "utf8");

    const prohibited = [
      "EnterpriseTissIntelligenceDiscoveryEngine",
      "EnterpriseTissIntelligenceCanonicalEngine",
      "EnterpriseTissIntelligenceRegistryEngine",
      "EnterpriseTissIntelligenceDecisionEngine",
      "EnterpriseTissMappingDiscoveryEngine",
      "EnterpriseTissMappingCanonicalEngine",
      "EnterpriseTissMappingRegistryEngine",
      "EnterpriseTissMappingQueryEngine",
      "EnterpriseTissVocabularyDiscoveryEngine",
      "EnterpriseTissVocabularyCanonicalEngine",
      "EnterpriseTissVocabularyRegistryEngine",
      "EnterpriseTissVocabularyQueryEngine",
    ];

    for (const name of prohibited) {
      assert.ok(
        !source.includes(name),
        `A engine não deve importar ${name}`,
      );
    }
  });
});
