/**
 * EnterpriseGenericTissIntelligenceEngine — EPC-22E.
 *
 * Unico Gateway oficial da Fase 6 (TISS Intelligence Foundation).
 * Nao implementa IA, inferencia, Decision Engine, Rule Engine, Explainability,
 * Recommendation, Runtime, Machine Learning, XML, SOAP, OCR, cache,
 * persistencia, consulta ou algoritmos.
 *
 * Consolida estruturalmente todas as camadas inferiores e os Gateways
 * das fases anteriores, sendo o unico ponto oficial de acesso a
 * TISS Intelligence Foundation.
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
import { EnterpriseTissIntelligenceDecisionEngine } from "../intelligence-decision";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC22E_GENERIC_TISS_INTELLIGENCE_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseGenericTissIntelligenceEngine {
  constructor(
    readonly decisionEngine: EnterpriseTissIntelligenceDecisionEngine,
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
    return EPC22E_GENERIC_TISS_INTELLIGENCE_CAPABILITIES;
  }
}
