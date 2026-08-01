/**
 * ConceptRelationship — representação estrutural (EPC-20 / FASE 8).
 *
 * Exemplos estruturais (sem implementação de grafo / traversal):
 *   Procedure → Authorization → Guide → Audit
 *
 * Somente representação. Sem lógica. Sem motor de relacionamento.
 */
import type {
  TISSConceptCategory,
  TISSConceptStatus,
  TISSConceptTag,
  TISSConfigurationReference,
  TISSMetadataReference,
} from "./models";

/**
 * Relacionamento estrutural entre conceitos do Vocabulário TISS.
 * Estrutural apenas — não executa joins, validação ou workflow.
 */
export type ConceptRelationship = {
  id: string;
  version?: string;
  status?: TISSConceptStatus;
  metadataReference?: TISSMetadataReference;
  configurationReference?: TISSConfigurationReference;
  tags?: readonly TISSConceptTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;

  /** Categoria semântica da origem. */
  sourceCategory: TISSConceptCategory;
  /** ConceptId da origem. */
  sourceConceptId: string;
  /** Categoria semântica do destino. */
  targetCategory: TISSConceptCategory;
  /** ConceptId do destino. */
  targetConceptId: string;
  /**
   * Tipo estrutural livre do relacionamento
   * (ex.: "procedure-authorization", "authorization-guide").
   */
  relationshipType?: string;
  description?: string;
};

/**
 * Cadeia estrutural de exemplo documentada (não executável).
 * Serve como referência de modelagem — sem runtime.
 */
export const TISS_RELATIONSHIP_CHAIN_EXAMPLE = [
  "procedure",
  "authorization",
  "guide",
  "audit",
] as const satisfies readonly TISSConceptCategory[];
