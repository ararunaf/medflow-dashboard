/**
 * Tipos vendor-agnósticos da TISS Vocabulary Foundation — EPC-20.
 *
 * Catálogo semântico desacoplado do layout XML TISS.
 * NÃO conhece parsers, validações, regras, operadoras, OCR, IA,
 * Workflow, APIs, banco ou UI.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → TISSVocabularyPort → Adapter → Store → Factory → Provider
 */
import type { TISSConcept, TISSConceptCategory, TISSConceptTag } from "./models";
import type { ConceptRelationship } from "./relationships";

export type { TISSConcept, TISSConceptCategory, TISSConceptTag };
export type { ConceptRelationship };

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do TISS Vocabulary (extensível). */
export type TISSVocabularyProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerConcept / getConcept / listConcepts
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada de registro / upsert estrutural de conceito. */
export type RegisterConceptInput = {
  concept: TISSConcept;
};

/** Resultado estrutural de registerConcept. */
export type RegisterConceptResult = {
  ok: boolean;
  conceptId?: string;
  concept?: TISSConcept;
  message?: string;
  code?: string;
};

/** Entrada de leitura por id ou código. */
export type GetConceptInput = {
  conceptId?: string;
  conceptCode?: string;
  category?: TISSConceptCategory;
};

/** Resultado estrutural de getConcept. */
export type GetConceptResult = {
  ok: boolean;
  concept?: TISSConcept;
  message?: string;
  code?: string;
};

/** Filtros estruturais opcionais de listagem. */
export type ListConceptsInput = {
  category?: TISSConceptCategory;
  status?: string;
  tag?: TISSConceptTag;
  conceptCodePrefix?: string;
};

/** Resultado estrutural de listConcepts. */
export type ListConceptsResult = {
  ok: boolean;
  concepts: readonly TISSConcept[];
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type TISSVocabularyHealth = {
  ok: boolean;
  provider: TISSVocabularyProviderId;
  latencyMs?: number;
  message?: string;
  /** Contagem de conceitos no store. */
  storedConceptCount?: number;
  /** Contagem de relacionamentos estruturais no store (se suportado). */
  storedRelationshipCount?: number;
};

/**
 * Capacidades do TISSVocabularyPort (adapter-level).
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type TISSVocabularyCapabilities = {
  provider: TISSVocabularyProviderId;
  adapterId: string;
  supportsRegisterConcept: boolean;
  supportsGetConcept: boolean;
  supportsListConcepts: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  /** Catálogo semântico canônico (conceitos, não layouts). */
  supportsCanonicalVocabulary: boolean;
  /** Relacionamentos estruturais (sem motor). */
  supportsStructuralRelationships: boolean;
  /** Prep — futuro TISS Mapping (sem implementação). */
  supportsFutureTissMapping: boolean;
  /** Prep — futuro Healthcare Model bind (sem implementação). */
  supportsFutureHealthcareModel: boolean;
  /** Prep — futuro Rule Engine (sem implementação). */
  supportsFutureRuleEngine: boolean;
  /** Prep — futuro Workflow (sem implementação). */
  supportsFutureWorkflow: boolean;
  /** Prep — futuro AI Auditor (sem implementação). */
  supportsFutureAiAuditor: boolean;
  /** Prep — futuro OCR (sem implementação). */
  supportsFutureOcr: boolean;
  /** Vocabulário independente de layout XML. */
  independentOfXmlLayout: true;
  /** Vocabulário independente de versão XML TISS. */
  independentOfXmlVersion: true;
  /** Preparado para múltiplas versões TISS via Mapping futuro. */
  supportsFutureMultiVersionTiss: true;
  /** Explicitamente sem parser XML nesta fundação. */
  implementsXmlParser: false;
  /** Explicitamente sem validação TISS nesta fundação. */
  implementsTissValidation: false;
  /** Explicitamente sem regras nesta fundação. */
  implementsRules: false;
  /** Explicitamente sem operadora/cooperativa nesta fundação. */
  knowsOperatorOrCooperative: false;
};

/** Opções de resolução do TISSVocabularyPort (provider factory). */
export type TISSVocabularyProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultTISSVocabularyAdapter).
   */
  provider?: TISSVocabularyProviderId;
};
