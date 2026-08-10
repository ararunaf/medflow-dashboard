/**
 * EnterpriseGenericTissMappingEngine — EPC-21E.
 *
 * Gateway oficial da TISS Mapping Foundation. Responsável por consolidar
 * as quatro camadas inferiores (Discovery, Canonical, Registry, Query) e
 * expor a Fase 5 de forma estrutural a consumidores externos.
 *
 * Não implementa consultas reais, parser, IA, inferencia, algoritmo,
 * persistencia, cache, indexacao, XML, SOAP, runtime, workflow funcional,
 * carregamento, mapeamento funcional ou banco de dados.
 *
 * E o unico ponto oficial de acesso a Mapping Foundation. Nenhum modulo
 * externo deve importar as engines internas de mapeamento.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseTissMappingDiscoveryEngine } from "../mapping-discovery";
import { EnterpriseTissMappingCanonicalEngine } from "../mapping-canonical";
import { EnterpriseTissMappingRegistryEngine } from "../mapping-registry";
import { EnterpriseTissMappingQueryEngine } from "../mapping-query";
import {
  EnterpriseTissMappingCapabilities,
  EPC21E_GENERIC_TISS_MAPPING_ENGINE_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseGenericTissMappingEngine {
  constructor(
    readonly queryEngine: EnterpriseTissMappingQueryEngine,
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
    return EPC21E_GENERIC_TISS_MAPPING_ENGINE_CAPABILITIES;
  }
}
