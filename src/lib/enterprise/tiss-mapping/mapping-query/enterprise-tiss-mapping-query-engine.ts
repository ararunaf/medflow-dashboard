/**
 * EnterpriseTissMappingQueryEngine — EPC-21D.
 *
 * Camada estrutural de preparacao para consultas do mapeamento TISS
 * Enterprise. Nao implementa consultas reais, parser, algoritmo, IA,
 * inferencia, indexacao, cache, persistencia, XML, SOAP, workflow, runtime,
 * banco de dados, carregamento, busca funcional ou mapeamento funcional.
 *
 * Consome o Registry para, futuramente, realizar consultas. Nesta sprint
 * a Query Engine e exclusivamente estrutural e nao executa nenhuma
 * operacao sobre os contratos canonicos.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseTissMappingDiscoveryEngine } from "../mapping-discovery";
import { EnterpriseTissMappingCanonicalEngine } from "../mapping-canonical";
import { EnterpriseTissMappingRegistryEngine } from "../mapping-registry";
import {
  EnterpriseTissMappingCapabilities,
  EPC21D_TISS_MAPPING_QUERY_ENGINE_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissMappingQueryEngine {
  constructor(
    readonly registryEngine: EnterpriseTissMappingRegistryEngine,
    readonly canonicalEngine: EnterpriseTissMappingCanonicalEngine,
    readonly discoveryEngine: EnterpriseTissMappingDiscoveryEngine,
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissMappingCapabilities {
    return EPC21D_TISS_MAPPING_QUERY_ENGINE_CAPABILITIES;
  }
}
