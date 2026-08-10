/**
 * EnterpriseTissRuntimeRegistryEngine — EPC-23C.
 *
 * Camada de registro estrutural da Fase 7 (Enterprise Runtime Foundation).
 * Nao implementa execucao, runtime, scheduler, workflow, queue, event bus,
 * message broker, task runner, persistencia, banco, cache, Rule Engine,
 * Decision Engine, Explainability, Recommendation, Inference, Machine Learning,
 * LLM, OCR, SOAP, XML, TISS, parser, validator, REST, GraphQL, Supabase,
 * Edge Functions, telemetria, consulta, busca, dispatch ou integracao externa.
 *
 * Consome exclusivamente as camadas inferiores da propria Foundation
 * (EnterpriseTissRuntimeDiscoveryEngine e EnterpriseTissRuntimeCanonicalEngine),
 * os Gateways oficiais das fases anteriores (Vocabulary, Mapping, Intelligence)
 * e os motores base compartilhados (Blocos H/I/J).
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseGenericTissMappingEngine } from "../../tiss-mapping/generic-mapping";
import { EnterpriseGenericTissIntelligenceEngine } from "../../tiss-intelligence-engine/generic-intelligence";
import { EnterpriseTissRuntimeDiscoveryEngine } from "../runtime-discovery";
import { EnterpriseTissRuntimeCanonicalEngine } from "../runtime-canonical";
import {
  EnterpriseTissRuntimeCapabilities,
  EPC23C_TISS_RUNTIME_REGISTRY_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissRuntimeRegistryEngine {
  constructor(
    readonly discoveryEngine: EnterpriseTissRuntimeDiscoveryEngine,
    readonly canonicalEngine: EnterpriseTissRuntimeCanonicalEngine,
    readonly genericIntelligenceEngine: EnterpriseGenericTissIntelligenceEngine,
    readonly genericMappingEngine: EnterpriseGenericTissMappingEngine,
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissRuntimeCapabilities {
    return EPC23C_TISS_RUNTIME_REGISTRY_CAPABILITIES;
  }
}
