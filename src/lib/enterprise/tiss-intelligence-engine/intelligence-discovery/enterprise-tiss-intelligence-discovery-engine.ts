/**
 * EnterpriseTissIntelligenceDiscoveryEngine — EPC-22A.
 *
 * Camada estrutural de descoberta da Fase 6 (TISS Intelligence).
 * Nao implementa IA, regras, inferencia, recomendacoes, Decision Engine,
 * Explainability, parser, XML, SOAP, OCR, TUSS, runtime, cache, persistencia,
 * banco, Supabase, Edge Functions, filas, eventos, telemetria ou integracao externa.
 *
 * Consome exclusivamente os Gateways oficiais das fases inferiores
 * (GenericTissMappingEngine e GenericTissVocabularyEngine) e os motores
 * base compartilhados (Blocos H/I/J).
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseGenericTissMappingEngine } from "../../tiss-mapping/generic-mapping";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC22A_TISS_INTELLIGENCE_DISCOVERY_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissIntelligenceDiscoveryEngine {
  constructor(
    readonly genericMappingEngine: EnterpriseGenericTissMappingEngine,
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissIntelligenceCapabilities {
    return EPC22A_TISS_INTELLIGENCE_DISCOVERY_CAPABILITIES;
  }
}
