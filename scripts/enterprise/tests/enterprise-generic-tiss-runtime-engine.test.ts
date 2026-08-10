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
import { EnterpriseGenericTissRuntimeEngine } from "../../../src/lib/enterprise/tiss-runtime/generic-runtime";
import { EPC23E_TISS_GENERIC_RUNTIME_CAPABILITIES } from "../../../src/lib/enterprise/tiss-runtime/ports/capabilities";

const sourcePath = fileURLToPath(
  new URL(
    "../../../src/lib/enterprise/tiss-runtime/generic-runtime/enterprise-generic-tiss-runtime-engine.ts",
    import.meta.url,
  ),
);

describe("EPC-23E EnterpriseGenericTissRuntimeEngine", () => {
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

  const runtimeEngine = new EnterpriseGenericTissRuntimeEngine(
    discoveryEngine,
    canonicalEngine,
    registryEngine,
    orchestrationEngine,
    intelligence,
    mapping,
    vocabulary,
    genericTiss,
    genericIntegration,
    workflow,
    master,
  );

  it("construção da engine", () => {
    assert.ok(runtimeEngine);
    assert.equal(runtimeEngine.discoveryEngine, discoveryEngine);
    assert.equal(runtimeEngine.canonicalEngine, canonicalEngine);
    assert.equal(runtimeEngine.registryEngine, registryEngine);
    assert.equal(runtimeEngine.orchestrationEngine, orchestrationEngine);
    assert.ok(runtimeEngine.genericIntelligenceEngine);
    assert.ok(runtimeEngine.genericMappingEngine);
    assert.ok(runtimeEngine.genericVocabularyEngine);
    assert.ok(runtimeEngine.genericTissEngine);
    assert.ok(runtimeEngine.genericTissIntegrationEngine);
    assert.ok(runtimeEngine.workflowEngine);
    assert.ok(runtimeEngine.masterOrchestrationEngine);
  });

  it("getCapabilities() retorna as capacidades corretas", () => {
    const capabilities = runtimeEngine.getCapabilities();
    assert.equal(
      capabilities,
      EPC23E_TISS_GENERIC_RUNTIME_CAPABILITIES,
      "getCapabilities deve retornar o objeto canônico EPC23E",
    );
  });

  it("todas as capabilities da Runtime Foundation estão ativas", () => {
    const caps = runtimeEngine.getCapabilities();
    assert.strictEqual(caps.tissRuntimeDiscoveryImplemented, true);
    assert.strictEqual(caps.tissRuntimeCanonicalModelImplemented, true);
    assert.strictEqual(caps.tissRuntimeRegistryImplemented, true);
    assert.strictEqual(caps.tissRuntimeOrchestrationImplemented, true);
    assert.strictEqual(caps.tissGenericRuntimeEngineImplemented, true);
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
