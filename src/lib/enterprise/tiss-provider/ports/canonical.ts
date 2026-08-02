/**
 * Modelos canônicos do TISS Provider — TISS-01.
 *
 * Únicos modelos canônicos TISS do Provider:
 *   CanonicalTISSRequest
 *   CanonicalTISSResult
 *   CanonicalTISSMetadata
 *   CanonicalTISSProfileReference
 *   CanonicalTISSProviderReference
 *
 * Sem modelos específicos de operadora, contrato, cooperativa, cliente ou tenant.
 * Variação futura exclusivamente via Providers / Rule Packs / Metadata / Config / Profiles.
 */

/** Modo estrutural suportado pela infraestrutura TISS-01 (sem XML/ANS reais). */
export type CanonicalTISSMode =
  | "structural-process"
  | "resolve-profile"
  | "resolve-provider"
  | "health-probe";

/** Referência canônica opaca a um TISS Profile (sem conteúdo de regra). */
export type CanonicalTISSProfileReference = {
  kind: "canonical-tiss-profile-reference";
  profileRef: string;
  version?: string;
  namespace?: string;
};

/** Referência canônica opaca ao Provider TISS ativo. */
export type CanonicalTISSProviderReference = {
  kind: "canonical-tiss-provider-reference";
  providerRef: string;
  adapterId?: string;
  version?: string;
};

/** Metadados canônicos de uma operação TISS. */
export type CanonicalTISSMetadata = {
  kind: "canonical-tiss-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  documentId?: string;
  profileRef?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Pedido canônico TISS (infraestrutura — sem XML / sem operadora). */
export type CanonicalTISSRequest = {
  kind: "canonical-tiss-request";
  mode: CanonicalTISSMode;
  metadata: CanonicalTISSMetadata;
  documentId?: string;
  profileReference?: CanonicalTISSProfileReference;
  providerReference?: CanonicalTISSProviderReference;
  /** Bag estrutural — adapters não interpretam domínio clínico/operadora. */
  structuralNotes?: string;
};

/** Resultado canônico TISS. */
export type CanonicalTISSResult = {
  kind: "canonical-tiss-result";
  ok: boolean;
  request?: CanonicalTISSRequest;
  metadata?: CanonicalTISSMetadata;
  profileReference?: CanonicalTISSProfileReference;
  providerReference?: CanonicalTISSProviderReference;
  requestId?: string;
  message?: string;
  code?: string;
  /**
   * TISS-01: infraestrutura apenas — sempre false até sprints funcionais pós TISS-GATE-01.
   * Nenhum XML real / envio a operadora / validação ANS nesta sprint.
   */
  realTissExecuted: boolean;
};
