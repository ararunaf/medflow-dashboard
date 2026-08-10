/**
 * EnterpriseGenericTissVocabularyEngine — EPC-20E.
 *
 * Gateway oficial do Vocabulário TISS Enterprise.
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
import { EnterpriseTissVocabularyQueryEngine } from "../vocabulary-query";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC20E_GENERIC_TISS_VOCABULARY_ENGINE_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseGenericTissVocabularyEngine {
  constructor(
    readonly queryEngine: EnterpriseTissVocabularyQueryEngine,
    readonly registryEngine: EnterpriseTissVocabularyRegistryEngine,
    readonly canonicalEngine: EnterpriseTissVocabularyCanonicalEngine,
    readonly discoveryEngine: EnterpriseTissVocabularyDiscoveryEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissIntelligenceCapabilities {
    return EPC20E_GENERIC_TISS_VOCABULARY_ENGINE_CAPABILITIES;
  }
}
