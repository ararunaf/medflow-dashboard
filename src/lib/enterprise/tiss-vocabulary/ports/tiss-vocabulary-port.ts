/**
 * TISSVocabularyPort — contrato único do TISS Vocabulary (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, factory ou adapters ficam fora do Domain.
 *
 * EPC-20: fundação do Vocabulário Canônico TISS.
 * NÃO implementa parser XML, validações, regras, OCR, IA, Workflow,
 * Healthcare Model, Mapping, APIs, banco, UI ou migrations.
 */
import type {
  GetConceptInput,
  GetConceptResult,
  ListConceptsInput,
  ListConceptsResult,
  RegisterConceptInput,
  RegisterConceptResult,
  TISSVocabularyCapabilities,
  TISSVocabularyHealth,
  TISSVocabularyProviderId,
} from "./types";

export interface TISSVocabularyPort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly providerId: TISSVocabularyProviderId;

  /**
   * Registra / atualiza um conceito canônico no store in-process.
   * Sem validação de negócio. Sem interpretação ANS/XML.
   */
  registerConcept(input: RegisterConceptInput): Promise<RegisterConceptResult>;

  /** Obtém um conceito canônico por id ou código. */
  getConcept(input: GetConceptInput): Promise<GetConceptResult>;

  /** Lista conceitos canônicos (filtros estruturais opcionais). */
  listConcepts(input?: ListConceptsInput): Promise<ListConceptsResult>;

  /** Verificação leve de prontidão (sem I/O externo obrigatório). */
  health(): Promise<TISSVocabularyHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): TISSVocabularyCapabilities;
}
