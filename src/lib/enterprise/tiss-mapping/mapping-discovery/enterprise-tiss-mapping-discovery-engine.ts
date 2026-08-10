/**
 * EnterpriseTissMappingDiscoveryEngine — EPC-21A.
 *
 * Camada estrutural de descoberta do mapeamento TISS Enterprise.
 * Não implementa consulta real, parser, IA, inferência, carregamento,
 * indexação, cache, persistência, algoritmo de busca ou infraestrutura runtime.
 *
 * A Fase 5 consome a Fase 4 exclusivamente através do
 * EnterpriseGenericTissVocabularyEngine. Nenhuma engine interna da
 * Vocabulary Foundation é importada diretamente.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import {
  EnterpriseTissMappingCapabilities,
  EPC21A_TISS_MAPPING_DISCOVERY_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissMappingDiscoveryEngine {
  constructor(
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissMappingCapabilities {
    return EPC21A_TISS_MAPPING_DISCOVERY_CAPABILITIES;
  }
}
