/**
 * EnterpriseTissVocabularyQueryEngine — EPC-20D.
 *
 * Camada estrutural de query do vocabulário TISS Enterprise.
 * Não implementa consulta real, parser, IA, inferência, carregamento,
 * indexação, cache, persistência, algoritmo de busca ou infraestrutura runtime.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseTissVocabularyDiscoveryEngine } from "../vocabulary-discovery";
import { EnterpriseTissVocabularyCanonicalEngine } from "../vocabulary-canonical";
import { EnterpriseTissVocabularyRegistryEngine } from "../vocabulary-registry";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC20D_TISS_VOCABULARY_QUERY_ENGINE_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissVocabularyQueryEngine {
  constructor(
    readonly registryEngine: EnterpriseTissVocabularyRegistryEngine,
    readonly canonicalEngine: EnterpriseTissVocabularyCanonicalEngine,
    readonly discoveryEngine: EnterpriseTissVocabularyDiscoveryEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissIntelligenceCapabilities {
    return EPC20D_TISS_VOCABULARY_QUERY_ENGINE_CAPABILITIES;
  }
}
