/**
 * EnterpriseTissIntelligenceRegistryEngine — EPC-22C.
 *
 * Camada estrutural de registro e referenciação da Fase 6 (TISS Intelligence).
 * Não executa decisões, não executa IA, não consulta, não possui cache,
 * não possui persistencia, nao possui runtime, nao possui algoritmos,
 * nao possui regras, nao possui recomendacao, nao possui explainability,
 * nao possui score e nao possui inferencia.
 *
 * A Registry organiza e referencia estruturalmente os contratos das
 * camadas inferiores: Discovery, Canonical e os Gateways oficiais.
 *
 * Consome exclusivamente as engines autorizadas e os motores base
 * compartilhados (Blocos H/I/J).
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseGenericTissMappingEngine } from "../../tiss-mapping/generic-mapping";
import { EnterpriseTissIntelligenceDiscoveryEngine } from "../intelligence-discovery";
import { EnterpriseTissIntelligenceCanonicalEngine } from "../intelligence-canonical";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC22C_TISS_INTELLIGENCE_REGISTRY_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissIntelligenceRegistryEngine {
  constructor(
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
    return EPC22C_TISS_INTELLIGENCE_REGISTRY_CAPABILITIES;
  }
}
