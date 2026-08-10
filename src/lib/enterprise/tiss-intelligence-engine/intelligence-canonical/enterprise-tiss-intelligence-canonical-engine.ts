/**
 * EnterpriseTissIntelligenceCanonicalEngine — EPC-22B.
 *
 * Camada estrutural de modelos canônicos de decisão da Fase 6 (TISS Intelligence).
 * Não implementa IA, regras, inferência, recomendações, Decision Engine,
 * Explainability, Rule Evaluation, parser, XML, SOAP, OCR, TUSS, runtime,
 * cache, persistência, banco, Supabase, filas, eventos, Edge Functions ou
 * integração externa.
 *
 * Consome exclusivamente a Discovery Engine da Fase 6 e os Gateways oficiais
 * das fases anteriores, além dos motores base compartilhados (Blocos H/I/J).
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseGenericTissMappingEngine } from "../../tiss-mapping/generic-mapping";
import { EnterpriseTissIntelligenceDiscoveryEngine } from "../intelligence-discovery";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC22B_TISS_INTELLIGENCE_CANONICAL_MODEL_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissIntelligenceCanonicalEngine {
  constructor(
    readonly discoveryEngine: EnterpriseTissIntelligenceDiscoveryEngine,
    readonly genericMappingEngine: EnterpriseGenericTissMappingEngine,
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissIntelligenceCapabilities {
    return EPC22B_TISS_INTELLIGENCE_CANONICAL_MODEL_CAPABILITIES;
  }
}
