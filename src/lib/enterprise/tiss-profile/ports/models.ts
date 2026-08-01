/**
 * Modelos canônicos do TISS Profile — EPC-22.
 *
 * Representam exclusivamente a estrutura documental esperada de um padrão TISS.
 * O Profile NÃO representa uma guia específica.
 * O Profile representa um padrão estrutural reutilizável.
 *
 * NÃO validam dados. NÃO executam regras. NÃO conhecem contratos.
 * NÃO conhecem parsers XML, OCR, AI, Workflow, banco, APIs ou UI.
 *
 * Pipeline arquitetural (futuro):
 *   Origem → Mapping → Vocabulary → Profile → Healthcare Model → Rule Engine → AI Auditor
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a Metadata Engine. */
export type ProfileEngineMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Configuration Engine. */
export type ProfileConfigurationReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Status / Tags / Version families
 * ───────────────────────────────────────────────────────────────────────── */

/** Status estrutural genérico — sem semântica de negócio. */
export type ProfileStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived"
  | "unknown"
  | (string & {});

/** Tag genérica — classificação livre. */
export type ProfileTag = string;

/**
 * Família de versão TISS suportada estruturalmente.
 * Apenas rótulos — nenhuma versão é implementada nesta sprint.
 */
export type ProfileVersionFamily = "tiss-4.x" | "tiss-5.x" | "proprietary" | (string & {});

/** Catálogo estático de famílias de versão (infraestrutura apenas). */
export const PROFILE_VERSION_FAMILIES: readonly ProfileVersionFamily[] = [
  "tiss-4.x",
  "tiss-5.x",
  "proprietary",
] as const;

/**
 * Requirement estrutural de um conceito no Profile.
 * Declara presença esperada — NÃO valida dados.
 */
export type ProfileRequirement = "mandatory" | "optional";

/**
 * Cardinalidade estrutural (rótulo).
 * Exemplos: "1", "0..1", "0..*", "1..*".
 * Sem validação.
 */
export type ProfileCardinality = "0..1" | "1" | "1..1" | "0..*" | "1..*" | (string & {});

/* ─────────────────────────────────────────────────────────────────────────
 * Base estrutural compartilhada
 * ───────────────────────────────────────────────────────────────────────── */

export type ProfileRecordBase = {
  id: string;
  version?: string;
  status?: ProfileStatus;
  engineMetadataReference?: ProfileEngineMetadataReference;
  configurationReference?: ProfileConfigurationReference;
  tags?: readonly ProfileTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ProfileConcept (FASE 6 / FASE 7)
 *
 * Conceito estrutural esperado dentro de um Profile.
 * Declara obrigatoriedade, opcionalidade, cardinalidade, ordem lógica
 * e observações estruturais — sem qualquer validação.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Conceito estrutural de um Profile.
 * Referencia o Vocabulário TISS por código/id — sem importar runtime.
 */
export type ProfileConcept = ProfileRecordBase & {
  kind: "profile-concept";

  /** ConceptCode do Vocabulário TISS (ex.: "TISS.BENEFICIARY"). */
  conceptCode: string;

  /** ConceptId opcional do Vocabulário TISS. */
  conceptId?: string;

  /** CanonicalName opcional do conceito (rótulo). */
  conceptName?: string;

  /** Obrigatoriedade estrutural — mandatory | optional. */
  requirement: ProfileRequirement;

  /** Cardinalidade estrutural (rótulo; sem validação). */
  cardinality?: ProfileCardinality;

  /** Ordem lógica estrutural (número livre). */
  logicalOrder?: number;

  /** Observações estruturais (não são regras). */
  structuralNotes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ProfileRelationship (FASE 6 / FASE 7)
 *
 * Relacionamento esperado entre conceitos do Profile.
 * Estrutural apenas — sem motor / traversal / validação.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Relacionamento estrutural esperado entre conceitos de um Profile.
 */
export type ProfileRelationship = ProfileRecordBase & {
  kind: "profile-relationship";

  /** Profile ao qual este relacionamento pertence. */
  profileId?: string;

  /** ConceptCode de origem. */
  sourceConceptCode: string;

  /** ConceptCode de destino. */
  targetConceptCode: string;

  /**
   * Tipo estrutural livre do relacionamento
   * (ex.: "contains", "references", "precedes").
   */
  relationshipType?: string;

  /** Flag estrutural: relacionamento esperado (sem validação). */
  expected?: boolean;

  /** Ordem lógica estrutural. */
  logicalOrder?: number;

  /** Observações estruturais (não são regras). */
  structuralNotes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ProfileVersion (FASE 6 / FASE 8)
 *
 * Suporte estrutural a múltiplas versões TISS.
 * Exemplos de família: tiss-4.x, tiss-5.x, proprietary.
 * Nenhuma versão é implementada — apenas infraestrutura.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Versão estrutural associada a um Profile.
 * Permite múltiplas versões TISS sem execute/parse/validação.
 */
export type ProfileVersion = ProfileRecordBase & {
  kind: "profile-version";

  /** Profile associado. */
  profileId: string;

  /** Rótulo de versão (ex.: "4.01.00", "5.0", "1.0-prop"). */
  versionLabel: string;

  /** Família estrutural (tiss-4.x | tiss-5.x | proprietary | …). */
  versionFamily?: ProfileVersionFamily;

  /** Flag estrutural de versão ativa (sem lógica de promoção). */
  isActive?: boolean;

  /** Observações estruturais. */
  structuralNotes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ProfileMetadata (FASE 6)
 *
 * Metadados estruturais do Profile — sem semântica de negócio.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de um Profile.
 * Descrevem o padrão documental — sem validação / regras / contratos.
 */
export type ProfileMetadata = ProfileRecordBase & {
  kind: "profile-metadata";

  /** Profile associado (opcional se embutido). */
  profileId?: string;

  /** Título estrutural. */
  title?: string;

  /** Resumo estrutural. */
  summary?: string;

  /** Hint de autoria / origem da definição (opaco). */
  authorHint?: string;

  /** Observações estruturais. */
  structuralNotes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * TISSProfile (FASE 6) — padrão estrutural reutilizável
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Profile canônico TISS.
 *
 * Informa:
 * - quais conceitos podem existir;
 * - quais são obrigatórios / opcionais;
 * - quais relacionamentos são esperados;
 * - quais versões da TISS suportam aquele Profile.
 *
 * Sem qualquer validação.
 */
export type TISSProfile = ProfileRecordBase & {
  kind: "profile";

  /** Nome estável do Profile. */
  name: string;

  /** Código canônico opaco do Profile (não é tag XML). */
  profileCode: string;

  /** Conceitos estruturais do padrão. */
  concepts?: readonly ProfileConcept[];

  /** Relacionamentos esperados (embutidos). */
  relationships?: readonly ProfileRelationship[];

  /** Ids de ProfileVersion associados. */
  versionIds?: readonly string[];

  /** Famílias de versão suportadas (rótulos estruturais). */
  supportedVersionFamilies?: readonly ProfileVersionFamily[];

  /** Id de ProfileMetadata associado. */
  metadataId?: string;

  /** Metadados embutidos (alternativa a metadataId). */
  metadata?: ProfileMetadata;

  /** Observações estruturais do padrão. */
  structuralNotes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * União estrutural de registros de profile
 * ───────────────────────────────────────────────────────────────────────── */

/** Qualquer registro canônico de profile armazenável. */
export type ProfileRecord =
  | TISSProfile
  | ProfileConcept
  | ProfileRelationship
  | ProfileVersion
  | ProfileMetadata;

/** Discriminador de kind de ProfileRecord. */
export type ProfileRecordKind = ProfileRecord["kind"];
