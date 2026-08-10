/**
 * EnterpriseTissVocabularyRegistryEngine — EPC-20C.
 *
 * Camada estrutural de registro do vocabulário TISS.
 * Não implementa consulta, cache, parser, IA, XML, persistência,
 * carregamento, mapeamento, infraestrutura runtime ou registry funcional.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseTissVocabularyDiscoveryEngine } from "../vocabulary-discovery";
import { EnterpriseTissVocabularyCanonicalEngine } from "../vocabulary-canonical";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC20C_TISS_VOCABULARY_REGISTRY_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissVocabularyRegistryEngine {
  constructor(
    readonly canonicalEngine: EnterpriseTissVocabularyCanonicalEngine,
    readonly discoveryEngine: EnterpriseTissVocabularyDiscoveryEngine,
    readonly genericTissEngine: GenericTissEngine,
    readonly genericTissIntegrationEngine: GenericTissIntegrationEngine,
    readonly workflowEngine: GenericWorkflowEngine,
    readonly masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissIntelligenceCapabilities {
    return EPC20C_TISS_VOCABULARY_REGISTRY_CAPABILITIES;
  }
}
