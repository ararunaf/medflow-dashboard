/**
 * Tipos vendor-agnósticos da camada de metadata — EPC-04.
 *
 * Nenhum tipo clínico, financeiro, TISS, OCR, IA, Workflow, Storage ou
 * Persistence de produto deve aparecer aqui. O Metadata Engine é genérico
 * e reutilizável em qualquer plataforma IAeasy.
 *
 * Conceitos nativos únicos:
 * Entity | Attribute | Relationship | Constraint | Schema | Template |
 * Property | Enumeration | Reference | Validation | Version | Namespace |
 * Tag | Category
 */

/** Provedores / mecanismos de metadata (extensível). */
export type MetadataProviderId = "default" | "mock" | "test" | "database" | "remote" | "registry";

/** Resultado de health check do mecanismo de metadata. */
export type MetadataHealth = {
  ok: boolean;
  provider: MetadataProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter.
 * Usado por Application/Domain para decisões sem conhecer o store.
 */
export type MetadataCapabilities = {
  provider: MetadataProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsRegisterSchema: boolean;
  supportsGetSchema: boolean;
  supportsListSchemas: boolean;
  supportsRegisterEntity: boolean;
  supportsGetEntity: boolean;
  supportsRegisterTemplate: boolean;
  supportsListTemplates: boolean;
  /** Herança preparada (infra); merge complexo fora de escopo. */
  supportsSchemaInheritance: boolean;
  /** Versionamento estrutural preparado. */
  supportsSchemaVersioning: boolean;
  /** Constraints estruturais (sem execução de validação). */
  supportsConstraints: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Conceitos nativos
 * ───────────────────────────────────────────────────────────────────────── */

/** Namespace lógico — isolamento estrutural de nomes. */
export type MetadataNamespace = string;

/** Tag genérica — classificação livre. */
export type MetadataTag = string;

/** Categoria genérica — agrupamento estrutural. */
export type MetadataCategory = string;

/** Identificador estável de um artefato de metadata. */
export type MetadataId = string;

/** Nome lógico dentro de um namespace. */
export type MetadataName = string;

/** Referência genérica a outro artefato de metadata. */
export type MetadataReference = {
  /** Id do alvo (quando conhecido). */
  id?: MetadataId;
  /** Nome lógico do alvo. */
  name?: MetadataName;
  /** Namespace do alvo. */
  namespace?: MetadataNamespace;
  /** Versão do alvo (quando versionado). */
  version?: MetadataVersionLabel;
  /** Tipo estrutural do alvo. */
  kind?: MetadataArtifactKind;
};

/** Tipos de artefato nativos do Metadata Engine. */
export type MetadataArtifactKind =
  | "entity"
  | "attribute"
  | "relationship"
  | "constraint"
  | "schema"
  | "template"
  | "property"
  | "enumeration"
  | "reference"
  | "validation"
  | "version"
  | "namespace"
  | "tag"
  | "category";

/** Rótulo de versão (semântica livre — sem semver obrigatório nesta sprint). */
export type MetadataVersionLabel = string;

/** Status estrutural de um Schema versionado. */
export type MetadataSchemaStatus = "draft" | "active" | "deprecated" | "retired" | "experimental";

/**
 * Compatibilidade estrutural entre versões (prep).
 * Sem política de upgrade/downgrade nesta sprint.
 */
export type MetadataCompatibility = {
  /** Versões com as quais este Schema declara compatibilidade. */
  compatibleWith?: readonly MetadataVersionLabel[];
  /** Versões explicitamente incompatíveis. */
  incompatibleWith?: readonly MetadataVersionLabel[];
  /** Notas estruturais livres. */
  notes?: string;
};

/**
 * Metadados de versionamento de Schema (FASE 7).
 * Sem persistência em banco — apenas estrutura em memória.
 */
export type MetadataVersionInfo = {
  version: MetadataVersionLabel;
  status: MetadataSchemaStatus;
  createdAt: string;
  updatedAt: string;
  author?: string;
  compatibility?: MetadataCompatibility;
};

/**
 * Tipos de property / valor estrutural (genéricos).
 * Sem regras de domínio clínico/financeiro.
 */
export type MetadataPropertyKind =
  | "boolean"
  | "number"
  | "string"
  | "integer"
  | "decimal"
  | "datetime"
  | "json"
  | "reference"
  | "enumeration"
  | "collection";

/** Property nativa — par nome/valor tipado genérico. */
export type MetadataProperty = {
  name: MetadataName;
  kind: MetadataPropertyKind;
  value?: unknown;
  description?: string;
  tags?: readonly MetadataTag[];
};

/** Enumeration nativa — conjunto fechado de valores. */
export type MetadataEnumeration = {
  id?: MetadataId;
  name: MetadataName;
  namespace?: MetadataNamespace;
  values: readonly string[];
  description?: string;
  tags?: readonly MetadataTag[];
  category?: MetadataCategory;
};

/**
 * Kinds de Constraint (FASE 8) — infraestrutura apenas.
 * NÃO há execução de validação nesta sprint.
 */
export type MetadataConstraintKind =
  | "required"
  | "unique"
  | "regex"
  | "range"
  | "collection"
  | "reference"
  | "expression";

/** Constraint nativa — definição estrutural sem evaluator. */
export type MetadataConstraint = {
  id?: MetadataId;
  name?: MetadataName;
  kind: MetadataConstraintKind;
  /** Alvo estrutural (atributo, entity, etc.) — referência genérica. */
  target?: MetadataReference;
  /** Parâmetros estruturais (ex.: pattern, min, max) — sem interpretação. */
  params?: Readonly<Record<string, unknown>>;
  description?: string;
  tags?: readonly MetadataTag[];
};

/**
 * Validation nativa — descriptor estrutural (FASE 8 prep).
 * NÃO executa regras; apenas descreve intenção futura.
 */
export type MetadataValidation = {
  id?: MetadataId;
  name?: MetadataName;
  /** Constraints associadas (ids ou refs). */
  constraints?: readonly MetadataReference[];
  description?: string;
  tags?: readonly MetadataTag[];
};

/** Attribute nativo — campo/coluna lógico de uma Entity. */
export type MetadataAttribute = {
  id?: MetadataId;
  name: MetadataName;
  kind: MetadataPropertyKind;
  description?: string;
  required?: boolean;
  /** Enum associado (quando kind = enumeration). */
  enumerationRef?: MetadataReference;
  /** Constraints estruturais anexadas (sem validação). */
  constraints?: readonly MetadataConstraint[];
  properties?: readonly MetadataProperty[];
  tags?: readonly MetadataTag[];
  category?: MetadataCategory;
};

/** Relationship nativa — vínculo estrutural entre Entities. */
export type MetadataRelationship = {
  id?: MetadataId;
  name: MetadataName;
  /** Origem. */
  from: MetadataReference;
  /** Destino. */
  to: MetadataReference;
  /** Cardinalidade estrutural livre (ex.: "1:N", "N:N"). */
  cardinality?: string;
  description?: string;
  properties?: readonly MetadataProperty[];
  tags?: readonly MetadataTag[];
  category?: MetadataCategory;
};

/** Entity nativa — unidade estrutural composta de Attributes/Relationships. */
export type MetadataEntity = {
  id: MetadataId;
  name: MetadataName;
  namespace?: MetadataNamespace;
  description?: string;
  attributes?: readonly MetadataAttribute[];
  relationships?: readonly MetadataRelationship[];
  properties?: readonly MetadataProperty[];
  constraints?: readonly MetadataConstraint[];
  tags?: readonly MetadataTag[];
  category?: MetadataCategory;
  /**
   * Herança estrutural (FASE 6) — referência ao Schema/Entity base.
   * Merge complexo NÃO implementado.
   */
  extends?: MetadataReference;
};

/**
 * Schema nativo — container versionado de Entities e artefatos.
 * Único ponto com Version / Status / CreatedAt / UpdatedAt / Author / Compatibility.
 */
export type MetadataSchema = {
  id: MetadataId;
  name: MetadataName;
  namespace?: MetadataNamespace;
  description?: string;
  versionInfo: MetadataVersionInfo;
  entities?: readonly MetadataReference[];
  enumerations?: readonly MetadataReference[];
  templates?: readonly MetadataReference[];
  properties?: readonly MetadataProperty[];
  tags?: readonly MetadataTag[];
  category?: MetadataCategory;
  /**
   * Herança de esquemas (FASE 6) — infraestrutura.
   * `extends` aponta para Schema base; sem flatten/merge nesta sprint.
   */
  extends?: MetadataReference;
};

/**
 * Template nativo (FASE 9) — infraestrutura genérica.
 * NÃO cria templates clínicos; apenas estrutura reutilizável.
 */
export type MetadataTemplate = {
  id: MetadataId;
  name: MetadataName;
  namespace?: MetadataNamespace;
  description?: string;
  /** Schema ao qual o template se aplica (opcional). */
  schemaRef?: MetadataReference;
  /** Slots / placeholders estruturais genéricos. */
  slots?: readonly MetadataProperty[];
  properties?: readonly MetadataProperty[];
  tags?: readonly MetadataTag[];
  category?: MetadataCategory;
  versionInfo?: MetadataVersionInfo;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

export type RegisterSchemaInput = {
  schema: MetadataSchema;
};

export type RegisterSchemaResult = {
  ok: boolean;
  id: MetadataId;
  message?: string;
};

export type GetSchemaInput = {
  id?: MetadataId;
  name?: MetadataName;
  namespace?: MetadataNamespace;
  version?: MetadataVersionLabel;
};

export type GetSchemaResult = {
  ok: boolean;
  schema?: MetadataSchema;
  message?: string;
};

export type ListSchemasInput = {
  namespace?: MetadataNamespace;
  status?: MetadataSchemaStatus;
  tag?: MetadataTag;
  category?: MetadataCategory;
  /** Prefixo de nome opcional. */
  namePrefix?: string;
};

export type ListSchemasResult = {
  ok: boolean;
  schemas: readonly MetadataSchema[];
  message?: string;
};

export type RegisterEntityInput = {
  entity: MetadataEntity;
  /** Schema opcional ao qual anexar a referência da entity. */
  schemaId?: MetadataId;
};

export type RegisterEntityResult = {
  ok: boolean;
  id: MetadataId;
  message?: string;
};

export type GetEntityInput = {
  id?: MetadataId;
  name?: MetadataName;
  namespace?: MetadataNamespace;
};

export type GetEntityResult = {
  ok: boolean;
  entity?: MetadataEntity;
  message?: string;
};

export type RegisterTemplateInput = {
  template: MetadataTemplate;
};

export type RegisterTemplateResult = {
  ok: boolean;
  id: MetadataId;
  message?: string;
};

export type ListTemplatesInput = {
  namespace?: MetadataNamespace;
  tag?: MetadataTag;
  category?: MetadataCategory;
  namePrefix?: string;
  schemaId?: MetadataId;
};

export type ListTemplatesResult = {
  ok: boolean;
  templates: readonly MetadataTemplate[];
  message?: string;
};

/** Opções de resolução do MetadataPort (provider factory). */
export type MetadataProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: MetadataProviderId;
};
