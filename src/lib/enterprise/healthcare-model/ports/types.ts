/**
 * Tipos vendor-agnósticos da Canonical Healthcare Model Foundation — EPC-19.
 *
 * Modelo canônico universal de saúde suplementar.
 * NÃO conhece TISS, TUSS, CID, ANS, operadoras, cooperativas,
 * OCR, IA, Workflow, Rule Engine, APIs, banco ou UI.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → HealthcareModelPort → Adapter → Store → Factory → Provider
 */
import type { HealthcareEntity, HealthcareEntityKind, HealthcareTag } from "./models";
import type { HealthcareRelationship } from "./relationships";

export type { HealthcareEntity, HealthcareEntityKind, HealthcareTag };
export type { HealthcareRelationship };

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Healthcare Model (extensível). */
export type HealthcareModelProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — createEntity / getEntity / listEntities
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada de criação / upsert estrutural de entidade. */
export type CreateHealthcareEntityInput = {
  entity: HealthcareEntity;
};

/** Resultado estrutural de createEntity. */
export type CreateHealthcareEntityResult = {
  ok: boolean;
  entityId?: string;
  entity?: HealthcareEntity;
  message?: string;
  code?: string;
};

/** Entrada de leitura por id. */
export type GetHealthcareEntityInput = {
  entityId: string;
  kind?: HealthcareEntityKind;
};

/** Resultado estrutural de getEntity. */
export type GetHealthcareEntityResult = {
  ok: boolean;
  entity?: HealthcareEntity;
  message?: string;
  code?: string;
};

/** Filtros estruturais opcionais de listagem. */
export type ListHealthcareEntitiesInput = {
  kind?: HealthcareEntityKind;
  status?: string;
  tag?: HealthcareTag;
  idPrefix?: string;
};

/** Resultado estrutural de listEntities. */
export type ListHealthcareEntitiesResult = {
  ok: boolean;
  entities: readonly HealthcareEntity[];
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type HealthcareModelHealth = {
  ok: boolean;
  provider: HealthcareModelProviderId;
  latencyMs?: number;
  message?: string;
  /** Contagem de entidades no store. */
  storedEntityCount?: number;
  /** Contagem de relacionamentos estruturais no store (se suportado). */
  storedRelationshipCount?: number;
};

/**
 * Capacidades do HealthcareModelPort (adapter-level).
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type HealthcareModelCapabilities = {
  provider: HealthcareModelProviderId;
  adapterId: string;
  supportsCreateEntity: boolean;
  supportsGetEntity: boolean;
  supportsListEntities: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  /** Modelos canônicos universais (sem padrão de mercado). */
  supportsCanonicalHealthcareModels: boolean;
  /** Relacionamentos estruturais (sem motor). */
  supportsStructuralRelationships: boolean;
  /** Prep — futuro OCR (sem implementação). */
  supportsFutureOcr: boolean;
  /** Prep — futuro Document Processing (sem implementação). */
  supportsFutureDocumentProcessing: boolean;
  /** Prep — futuro Contract Foundation (sem implementação). */
  supportsFutureContractFoundation: boolean;
  /** Prep — futuro Rule Engine (sem implementação). */
  supportsFutureRuleEngine: boolean;
  /** Prep — futuro AI Auditor (sem implementação). */
  supportsFutureAiAuditor: boolean;
  /** Prep — futuro TISS Intelligence (sem implementação). */
  supportsFutureTissIntelligence: boolean;
  /** Prep — futuro Workflow (sem implementação). */
  supportsFutureWorkflow: boolean;
  /** Explicitamente sem conhecimento TISS nesta fundação. */
  knowsTiss: false;
  /** Explicitamente sem conhecimento ANS nesta fundação. */
  knowsAns: false;
  /** Explicitamente sem operadora/cooperativa nesta fundação. */
  knowsOperatorOrCooperative: false;
};

/** Opções de resolução do HealthcareModelPort (provider factory). */
export type HealthcareModelProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultHealthcareModelAdapter).
   */
  provider?: HealthcareModelProviderId;
};
