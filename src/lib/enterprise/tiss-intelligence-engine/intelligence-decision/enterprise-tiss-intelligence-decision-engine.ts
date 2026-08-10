/**
 * EnterpriseTissIntelligenceDecisionEngine — EPC-22D.
 *
 * Camada estrutural de futura decisao da Fase 6 (TISS Intelligence).
 * Nesta sprint a engine NAO executa decisoes, NAO implementa IA,
 * NAO implementa LLM, NAO implementa inferencia, NAO implementa
 * recomendacao, NAO implementa Explainability, NAO implementa Rule Engine,
 * NAO implementa Scoring, NAO implementa Machine Learning, NAO implementa
 * Workflow, NAO implementa Runtime, NAO implementa algoritmos, NAO implementa
 * XML, SOAP, OCR, persistencia, cache ou consulta.
 *
 * A Decision Engine representa estruturalmente a futura camada decisoria,
 * referenciando as camadas inferiores (Registry, Canonical, Discovery)
 * e os Gateways oficiais das fases anteriores.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseGenericTissMappingEngine } from "../../tiss-mapping/generic-mapping";
import { EnterpriseTissIntelligenceDiscoveryEngine } from "../intelligence-discovery";
import { EnterpriseTissIntelligenceCanonicalEngine } from "../intelligence-canonical";
import { EnterpriseTissIntelligenceRegistryEngine } from "../intelligence-registry";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC22D_TISS_INTELLIGENCE_DECISION_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissIntelligenceDecisionEngine {
  constructor(
    readonly registryEngine: EnterpriseTissIntelligenceRegistryEngine,
    readonly canonicalEngine: EnterpriseTissIntelligenceCanonicalEngine,
    readonly discoveryEngine: EnterpriseTissIntelligenceDiscoveryEngine,
    readonly genericMappingEngine: EnterpriseGenericTissMappingEngine,
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissIntelligenceCapabilities {
    return EPC22D_TISS_INTELLIGENCE_DECISION_CAPABILITIES;
  }
}
