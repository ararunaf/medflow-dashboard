/**
 * EnterpriseTissVocabularyCanonicalEngine — EPC-20B.
 *
 * Estabelece os modelos canônicos que representam semanticamente o domínio TISS.
 * Não implementa carregamento, parser, armazenamento, consulta, inferência,
 * mapeamento, integração ou persistência.
 */
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseTissVocabularyDiscoveryEngine } from "../vocabulary-discovery";
import {
  EnterpriseTissIntelligenceCapabilities,
  EPC20B_TISS_VOCABULARY_CANONICAL_MODEL_CAPABILITIES,
} from "../ports/capabilities";
import {
  TissVocabularyDomain,
  TissVocabularyCategory,
  TissVocabularyGroup,
  TissVocabularyEntity,
  TissVocabularyField,
  TissVocabularyValue,
} from "./models";

export class EnterpriseTissVocabularyCanonicalEngine {
  constructor(
    readonly discovery: EnterpriseTissVocabularyDiscoveryEngine,
    readonly tiss: GenericTissEngine,
    readonly tissIntegration: GenericTissIntegrationEngine,
    readonly workflow: GenericWorkflowEngine,
    readonly masterOrchestration: EnterpriseMasterOrchestrationEngine,
  ) {}

  readonly models = {
    TissVocabularyDomain,
    TissVocabularyCategory,
    TissVocabularyGroup,
    TissVocabularyEntity,
    TissVocabularyField,
    TissVocabularyValue,
  } as const;

  getCapabilities(): EnterpriseTissIntelligenceCapabilities {
    return EPC20B_TISS_VOCABULARY_CANONICAL_MODEL_CAPABILITIES;
  }
}
