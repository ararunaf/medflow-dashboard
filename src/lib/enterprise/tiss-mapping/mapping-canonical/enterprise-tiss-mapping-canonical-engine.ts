/**
 * EnterpriseTissMappingCanonicalEngine — EPC-21B.
 *
 * Camada estrutural de modelo canônico do mapeamento TISS Enterprise.
 * Não implementa consulta real, parser, IA, inferência, carregamento,
 * indexação, cache, persistência, algoritmo de busca, mapeamento funcional
 * ou infraestrutura runtime.
 *
 * Os modelos canônicos são estruturas imutáveis (readonly) exportadas em
 * `models.ts`. A Fase 5 continua consumindo a Fase 4 exclusivamente
 * através do `EnterpriseGenericTissVocabularyEngine`.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseTissMappingDiscoveryEngine } from "../mapping-discovery";
import {
  EnterpriseTissMappingCapabilities,
  EPC21B_TISS_MAPPING_CANONICAL_MODEL_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissMappingCanonicalEngine {
  constructor(
    readonly discoveryEngine: EnterpriseTissMappingDiscoveryEngine,
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissMappingCapabilities {
    return EPC21B_TISS_MAPPING_CANONICAL_MODEL_CAPABILITIES;
  }
}
