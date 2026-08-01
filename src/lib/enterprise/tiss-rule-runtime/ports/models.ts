/**
 * Modelos canônicos do TISS Rule Runtime — EPC-23.
 *
 * Representação estrutural do pipeline de orquestração Enterprise.
 * O Runtime NÃO toma decisões. NÃO interpreta regras. NÃO interpreta contratos.
 * Sem validação TISS. Sem ANS. Sem OCR. Sem AI. Sem parser. Sem banco.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Status / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Status estrutural de execução / estágio. */
export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped";

/**
 * Estágios canônicos do ExecutionPipeline (FASE 7).
 * Ordem fixa — exclusivamente orquestração estrutural.
 */
export type ExecutionStageName =
  | "receive-healthcare-model"
  | "resolve-profile"
  | "resolve-contract-binding"
  | "resolve-rule-packs"
  | "dispatch-rule-engine"
  | "collect-result";

/** Kinds de registros canônicos do Runtime. */
export type ExecutionRecordKind =
  | "execution-context"
  | "execution-stage"
  | "execution-pipeline"
  | "execution-result"
  | "execution-metadata"
  | "execution-trace";

/** Famílias de versão preparadas (estrutural — sem implementação). */
export type RuntimeVersionFamily = "tiss-4.x" | "tiss-5.x" | "proprietary";

export const RUNTIME_VERSION_FAMILIES = [
  "tiss-4.x",
  "tiss-5.x",
  "proprietary",
] as const satisfies readonly RuntimeVersionFamily[];

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionStage
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estágio individual do pipeline.
 * Somente representação de progresso — sem lógica de negócio.
 */
export type ExecutionStage = {
  kind: "execution-stage";
  id: string;
  /** Nome canônico do estágio. */
  name: ExecutionStageName;
  /** Ordem lógica no pipeline (0-based). */
  order: number;
  status: ExecutionStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  /** Referência opaca ao artefato resolvido (sem interpretação). */
  artifactRef?: string;
  /** Mensagens estruturais (não são decisões). */
  notes?: string;
  errors?: readonly string[];
  warnings?: readonly string[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPipeline
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Pipeline canônico de orquestração (FASE 7).
 *
 * Representa exclusivamente:
 *   Healthcare Model → Profile → Contract Binding → Rule Packs
 *   → Rule Engine dispatch → Collect result
 *
 * Sem executar nenhuma regra.
 */
export type ExecutionPipeline = {
  kind: "execution-pipeline";
  id: string;
  executionId: string;
  stages: readonly ExecutionStage[];
  status: ExecutionStatus;
  currentStageName?: ExecutionStageName;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/** Metadados estruturais da execução. */
export type ExecutionMetadata = {
  kind: "execution-metadata";
  id: string;
  executionId: string;
  /** Tenant opaco (referência — sem resolução). */
  tenantRef?: string;
  /** Correlação entre sistemas. */
  correlationId?: string;
  /** Canal / origem estrutural. */
  channel?: string;
  /** Tags estruturais. */
  tags?: readonly string[];
  /** Atributos livres opacos. */
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  createdAt?: string;
  updatedAt?: string;
  status?: ExecutionStatus;
  version?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTrace
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Rastreamento canônico (FASE 10).
 * Sem persistência. Sem banco. In-process apenas.
 */
export type ExecutionTrace = {
  kind: "execution-trace";
  id: string;
  executionId: string;
  correlationId?: string;
  pipelineId: string;
  stages: readonly ExecutionStage[];
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  status: ExecutionStatus;
  errors: readonly string[];
  warnings: readonly string[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural coletado pelo Runtime.
 * O Runtime coleta sem interpretar.
 */
export type ExecutionResult = {
  kind: "execution-result";
  id: string;
  executionId: string;
  pipelineId: string;
  status: ExecutionStatus;
  /** Referências opacas aos artefatos resolvidos (sem interpretação). */
  healthcareModelRef?: string;
  profileRef?: string;
  bindingRefs?: readonly string[];
  rulePackRefs?: readonly string[];
  /** Placeholder estrutural do despacho ao Rule Engine (sem execução real). */
  ruleDispatchRef?: string;
  /** Payload opaco coletado (nunca interpretado pelo Runtime). */
  collectedPayload?: Readonly<Record<string, unknown>>;
  errors: readonly string[];
  warnings: readonly string[];
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  /** Prep — AI Auditor (sem integração). */
  aiAuditorPrepared: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * TISSExecutionContext
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Contexto canônico de uma execução do Runtime.
 * Entrada exclusiva: referência a Healthcare Model.
 */
export type TISSExecutionContext = {
  kind: "execution-context";
  id: string;
  /** Alias estável do execution id (mesmo que id). */
  executionId: string;
  correlationId?: string;
  pipelineId?: string;
  /** Referência opaca ao Healthcare Model (entrada exclusiva). */
  healthcareModelRef: string;
  /** Referências estruturais resolvidas ao longo do pipeline. */
  profileRef?: string;
  bindingRefs?: readonly string[];
  rulePackRefs?: readonly string[];
  ruleDispatchRef?: string;
  resultId?: string;
  traceId?: string;
  metadataId?: string;
  metadata?: ExecutionMetadata;
  status: ExecutionStatus;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  tags?: readonly string[];
  /** Notas estruturais. */
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** União de registros canônicos (documentação / tipagem auxiliar). */
export type ExecutionRecord =
  | TISSExecutionContext
  | ExecutionStage
  | ExecutionPipeline
  | ExecutionResult
  | ExecutionMetadata
  | ExecutionTrace;
