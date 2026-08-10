/**
 * EnterpriseTissRuntimeOrchestrationEngine — EPC-23D.
 *
 * Camada de orquestracao estrutural da Fase 7 (Enterprise Runtime Foundation).
 * Nao implementa execucao, runtime, scheduler, workflow runtime, pipeline,
 * dispatch, queue, event bus, message broker, task runner, persistencia,
 * banco, cache, Rule Engine, Decision Engine, Explainability, Recommendation,
 * Inference, Machine Learning, LLM, OCR, SOAP, XML, TISS, parser, validator,
 * REST, GraphQL, Supabase, Edge Functions, telemetria, consulta, busca,
 * execute ou integracao externa.
 *
 * Consome exclusivamente as camadas inferiores da propria Foundation
 * (Discovery, Canonical e Registry), os Gateways oficiais das fases
 * anteriores (Vocabulary, Mapping, Intelligence) e os motores base
 * compartilhados (Blocos H/I/J).
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
import { EnterpriseTissRuntimeRegistryEngine } from "../runtime-registry";
import {
  EnterpriseTissRuntimeCapabilities,
  EPC23D_TISS_RUNTIME_ORCHESTRATION_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissRuntimeOrchestrationEngine {
  constructor(
    readonly discoveryEngine: EnterpriseTissRuntimeDiscoveryEngine,
    readonly canonicalEngine: EnterpriseTissRuntimeCanonicalEngine,
    readonly registryEngine: EnterpriseTissRuntimeRegistryEngine,
    readonly genericIntelligenceEngine: EnterpriseGenericTissIntelligenceEngine,
    readonly genericMappingEngine: EnterpriseGenericTissMappingEngine,
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissRuntimeCapabilities {
    return EPC23D_TISS_RUNTIME_ORCHESTRATION_CAPABILITIES;
  }
}
