/**
 * EnterpriseTissVocabularyDiscoveryEngine — EPC-20A.
 *
 * Camada estrutural de descoberta de vocabulário TISS Enterprise.
 * Não interpreta XML, não realiza mapeamentos, não executa inferências,
 * não utiliza IA, não realiza consultas inteligentes e não persiste dados.
 * Contém apenas propriedades readonly, construtor e getCapabilities().
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC20A_TISS_VOCABULARY_DISCOVERY_CAPABILITIES,
} from "../ports/capabilities";

export class EnterpriseTissVocabularyDiscoveryEngine {
  constructor(
    readonly tiss: GenericTissEngine,
    readonly tissIntegration: GenericTissIntegrationEngine,
    readonly workflow: GenericWorkflowEngine,
    readonly masterOrchestration: EnterpriseMasterOrchestrationEngine,
  ) {}

  getCapabilities(): EnterpriseTissIntelligenceCapabilities {
    return EPC20A_TISS_VOCABULARY_DISCOVERY_CAPABILITIES;
  }
}
