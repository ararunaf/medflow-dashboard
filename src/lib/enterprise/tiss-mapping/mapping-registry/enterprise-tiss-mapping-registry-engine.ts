/**
 * EnterpriseTissMappingRegistryEngine — EPC-21C.
 *
 * Camada estrutural de registro do mapeamento TISS Enterprise.
 * Não implementa registro real, persistência, carregamento, indexação,
 * consulta, cache, parser, IA, inferência, XML, SOAP, workflow, runtime,
 * mapeamento funcional, algoritmo ou banco de dados.
 *
 * Responsável exclusivamente por organizar e referenciar os contratos
 * canônicos definidos na camada EPC-21B. Não substitui o Canonical Model
 * e não antecipa o Query Engine.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseTissMappingDiscoveryEngine } from "../mapping-discovery";
import { EnterpriseTissMappingCanonicalEngine } from "../mapping-canonical";
import {
  EnterpriseTissMappingCapabilities,
  EPC21C_TISS_MAPPING_REGISTRY_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissMappingRegistryEngine {
  constructor(
    readonly canonicalEngine: EnterpriseTissMappingCanonicalEngine,
    readonly discoveryEngine: EnterpriseTissMappingDiscoveryEngine,
    readonly genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissMappingCapabilities {
    return EPC21C_TISS_MAPPING_REGISTRY_CAPABILITIES;
  }
}
