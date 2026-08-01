/**
 * Tipos vendor-agnósticos da TISS Profile Foundation — EPC-22.
 *
 * Profile descreve exclusivamente a estrutura documental esperada.
 * NÃO executa regras. NÃO valida dados. NÃO interpreta contratos.
 * NÃO conhece parsers XML, OCR, AI, Workflow, APIs, banco ou UI.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → TISSProfilePort → Adapter → Store → Factory → Provider
 */
import type {
  ProfileMetadata,
  ProfileRelationship,
  ProfileStatus,
  ProfileTag,
  ProfileVersion,
  ProfileVersionFamily,
  TISSProfile,
} from "./models";

export type {
  ProfileCardinality,
  ProfileConcept,
  ProfileMetadata,
  ProfileRecord,
  ProfileRecordKind,
  ProfileRelationship,
  ProfileRequirement,
  ProfileStatus,
  ProfileTag,
  ProfileVersion,
  ProfileVersionFamily,
  TISSProfile,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do TISS Profile (extensível). */
export type TISSProfileProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerProfile / getProfile / listProfiles
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada de registro / upsert estrutural de Profile. */
export type RegisterProfileInput = {
  profile: TISSProfile;
  /** Versões estruturais opcionais a persistir junto do Profile. */
  versions?: readonly ProfileVersion[];
  /** Relacionamentos estruturais opcionais a persistir junto do Profile. */
  relationships?: readonly ProfileRelationship[];
  /** Metadados estruturais opcionais a persistir junto do Profile. */
  metadata?: ProfileMetadata;
};

/** Resultado estrutural de registerProfile. */
export type RegisterProfileResult = {
  ok: boolean;
  profileId?: string;
  profile?: TISSProfile;
  message?: string;
  code?: string;
};

/** Entrada de leitura de Profile por id ou código. */
export type GetProfileInput = {
  profileId?: string;
  profileCode?: string;
  name?: string;
};

/** Resultado estrutural de getProfile. */
export type GetProfileResult = {
  ok: boolean;
  profile?: TISSProfile;
  message?: string;
  code?: string;
};

/** Filtros estruturais opcionais de listagem. */
export type ListProfilesInput = {
  status?: ProfileStatus;
  tag?: ProfileTag;
  versionFamily?: ProfileVersionFamily;
  profileCodePrefix?: string;
  namePrefix?: string;
};

/** Resultado estrutural de listProfiles. */
export type ListProfilesResult = {
  ok: boolean;
  profiles: readonly TISSProfile[];
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type TISSProfileHealth = {
  ok: boolean;
  provider: TISSProfileProviderId;
  latencyMs?: number;
  message?: string;
  /** Contagem de Profiles no store. */
  storedProfileCount?: number;
  /** Contagem de ProfileVersions no store. */
  storedVersionCount?: number;
  /** Contagem de relacionamentos estruturais no store. */
  storedRelationshipCount?: number;
  /** Contagem de ProfileMetadata no store. */
  storedMetadataCount?: number;
};

/**
 * Capacidades do TISSProfilePort (adapter-level).
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type TISSProfileCapabilities = {
  provider: TISSProfileProviderId;
  adapterId: string;
  supportsRegisterProfile: boolean;
  supportsGetProfile: boolean;
  supportsListProfiles: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  /** Profile descreve estrutura documental (não guia específica). */
  supportsStructuralDocumentPattern: true;
  /** Conceitos obrigatórios / opcionais (estrutural). */
  supportsMandatoryOptionalConcepts: true;
  /** Cardinalidade estrutural (sem validação). */
  supportsCardinality: true;
  /** Relacionamentos esperados (estrutural). */
  supportsExpectedRelationships: true;
  /** Ordem lógica estrutural. */
  supportsLogicalOrder: true;
  /** Observações estruturais. */
  supportsStructuralNotes: true;
  /** Prep — múltiplas versões TISS (sem implementação de versões). */
  supportsMultiVersionTiss: true;
  /** Prep — TISS Mapping (sem integração). */
  supportsFutureTissMapping: true;
  /** Prep — Healthcare Model (sem integração). */
  supportsFutureHealthcareModel: true;
  /** Prep — Rule Engine (sem integração). */
  supportsFutureRuleEngine: true;
  /** Prep — AI Auditor (sem integração). */
  supportsFutureAiAuditor: true;
  /** Prep — OCR (sem integração). */
  supportsFutureOcr: true;
  /** Prep — FHIR (sem integração). */
  supportsFutureFhir: true;
  /** Prep — DICOM (sem integração). */
  supportsFutureDicom: true;
  /** Explicitamente sem parser XML nesta fundação. */
  implementsXmlParser: false;
  /** Explicitamente sem validação nesta fundação. */
  implementsValidation: false;
  /** Explicitamente sem regras nesta fundação. */
  implementsRules: false;
  /** Explicitamente sem Rule Engine nesta fundação. */
  implementsRuleEngine: false;
  /** Explicitamente sem Workflow nesta fundação. */
  implementsWorkflow: false;
  /** Explicitamente sem OCR nesta fundação. */
  implementsOcr: false;
  /** Explicitamente sem AI nesta fundação. */
  implementsAi: false;
  /** Explicitamente sem contratos nesta fundação. */
  implementsContracts: false;
  /** Profiles independentes de operadoras e cooperativas. */
  knowsOperatorOrCooperative: false;
  /** Profiles representam apenas estrutura documental. */
  representsDocumentStructureOnly: true;
};

/** Opções de resolução do TISSProfilePort (provider factory). */
export type TISSProfileProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultTISSProfileAdapter).
   */
  provider?: TISSProfileProviderId;
};
