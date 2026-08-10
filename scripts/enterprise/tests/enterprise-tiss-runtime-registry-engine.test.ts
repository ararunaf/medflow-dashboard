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
import { EPC23C_TISS_RUNTIME_REGISTRY_CAPABILITIES } from "../../../src/lib/enterprise/tiss-runtime/ports/capabilities";

const sourcePath = fileURLToPath(
  new URL(
    "../../../src/lib/enterprise/tiss-runtime/runtime-registry/enterprise-tiss-runtime-registry-engine.ts",
    import.meta.url,
  ),
);

describe("EPC-23C EnterpriseTissRuntimeRegistryEngine", () => {
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

  it("construção da engine", () => {
    assert.ok(registryEngine);
    assert.equal(registryEngine.discoveryEngine, discoveryEngine);
    assert.equal(registryEngine.canonicalEngine, canonicalEngine);
    assert.ok(registryEngine.genericIntelligenceEngine);
    assert.ok(registryEngine.genericMappingEngine);
    assert.ok(registryEngine.genericVocabularyEngine);
    assert.ok(registryEngine.genericTissEngine);
    assert.ok(registryEngine.genericTissIntegrationEngine);
    assert.ok(registryEngine.workflowEngine);
    assert.ok(registryEngine.masterOrchestrationEngine);
  });

  it("getCapabilities() retorna as capacidades corretas", () => {
    const capabilities = registryEngine.getCapabilities();
    assert.equal(
      capabilities,
      EPC23C_TISS_RUNTIME_REGISTRY_CAPABILITIES,
      "getCapabilities deve retornar o objeto canônico EPC23C",
    );
  });

  it("somente tissRuntimeRegistryImplemented = true", () => {
    const caps = registryEngine.getCapabilities();
    assert.strictEqual(caps.tissRuntimeDiscoveryImplemented, true);
    assert.strictEqual(caps.tissRuntimeCanonicalModelImplemented, true);
    assert.strictEqual(caps.tissRuntimeRegistryImplemented, true);
    assert.strictEqual(caps.tissRuntimeOrchestrationImplemented, false);
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
