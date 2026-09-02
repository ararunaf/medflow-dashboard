/**
 * Modelos canônicos do Canonical Execution Orchestrator — EPC-24.
 *
 * Representação estrutural da orquestração Enterprise end-to-end.
 * O Orquestrador NÃO toma decisões. NÃO executa OCR, IA, Mapping ou regras.
 * Sem validação TISS. Sem ANS. Sem parser. Sem banco. Sem UI.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Status / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Status estrutural de execução / step. */
export type CanonicalExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped";

/**
 * Steps canônicos do pipeline Enterprise (ordem fixa).
 * Orquestração estrutural exclusivamente via Ports da Foundation.
 */
export type CanonicalExecutionStepName =
  | "document-intake"
  | "document-processing"
  | "processing-provider"
  | "ocr-provider"
  | "tiss-profile"
  | "healthcare-model"
  | "contract-rule-binding"
  | "tiss-rule-runtime";

/** Kinds de registros canônicos do Orquestrador. */
export type CanonicalExecutionRecordKind =
  | "canonical-execution-request"
  | "canonical-execution-context"
  | "canonical-execution-step"
  | "canonical-execution-result"
  | "canonical-execution-trace";

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalExecutionRequest
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Pedido estrutural de execução canônica.
 * Contém apenas referências opacas — sem payload clínico / XML / OCR.
 */
export type CanonicalExecutionRequest = {
  kind: "canonical-execution-request";
  /** Correlação opcional entre sistemas. */
  correlationId?: string;
  /** Tenant opaco (referência — sem resolução). */
  tenantRef?: string;
  /** Canal / origem estrutural. */
  channel?: string;
  /** Tags estruturais. */
  tags?: readonly string[];
  /** Referência opaca ao intake de origem (sem invocar DocumentIntakePort). */
  intakeRef?: string;
  /** Referência opaca ao documento (sem processamento real). */
  documentRef?: string;
  /** Atributos livres opacos. */
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  /** Notas estruturais. */
  structuralNotes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalExecutionStep
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Step individual do pipeline canônico.
 * Somente representação de progresso + referência ao Port Foundation.
 * Sem lógica de negócio.
 */
export type CanonicalExecutionStep = {
  kind: "canonical-execution-step";
  id: string;
  /** Nome canônico do step. */
  name: CanonicalExecutionStepName;
  /** Ordem lógica no pipeline (0-based). */
  order: number;
  status: CanonicalExecutionStatus;
  /**
   * Referência estrutural ao Port Foundation orquestrado.
   * Comunicação exclusivamente via Ports — sem acoplamento a Engines.
   */
  portRef: string;
  /** Nome do contrato Port Foundation (ex.: DocumentIntakePort). */
  portContract: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  /** Referência opaca ao artefato produzido/estrutural (sem interpretação). */
  artifactRef?: string;
  /** Mensagens estruturais (não são decisões). */
  notes?: string;
  errors?: readonly string[];
  warnings?: readonly string[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalExecutionContext
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Contexto canônico de uma execução do Orquestrador.
 * Agrega request, steps e referências opacas ao longo do pipeline.
 */
export type CanonicalExecutionContext = {
  kind: "canonical-execution-context";
  id: string;
  /** Alias estável do execution id (mesmo que id). */
  executionId: string;
  correlationId?: string;
  request: CanonicalExecutionRequest;
  steps: readonly CanonicalExecutionStep[];
  status: CanonicalExecutionStatus;
  currentStepName?: CanonicalExecutionStepName;
  resultId?: string;
  traceId?: string;
  /** Refs opacas acumuladas por step (sem interpretação). */
  intakeRef?: string;
  documentRef?: string;
  processingRef?: string;
  ocrRef?: string;
  mappingRef?: string;
  vocabularyRef?: string;
  profileRef?: string;
  healthcareModelRef?: string;
  bindingRef?: string;
  runtimeRef?: string;
  auditorRef?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  tags?: readonly string[];
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalExecutionTrace
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Rastreamento canônico da orquestração.
 * Sem persistência. Sem banco. In-process apenas.
 */
export type CanonicalExecutionTrace = {
  kind: "canonical-execution-trace";
  id: string;
  executionId: string;
  correlationId?: string;
  steps: readonly CanonicalExecutionStep[];
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  status: CanonicalExecutionStatus;
  errors: readonly string[];
  warnings: readonly string[];
  /** Declara explicitamente que a orquestração usou apenas Ports. */
  portsOnly: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalExecutionResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural coletado pelo Orquestrador.
 * O Orquestrador coleta sem interpretar e sem executar Engines.
 */
export type CanonicalExecutionResult = {
  kind: "canonical-execution-result";
  id: string;
  executionId: string;
  status: CanonicalExecutionStatus;
  steps: readonly CanonicalExecutionStep[];
  /** Refs opacas finais (sem interpretação). */
  intakeRef?: string;
  documentRef?: string;
  processingRef?: string;
  ocrRef?: string;
  mappingRef?: string;
  vocabularyRef?: string;
  profileRef?: string;
  healthcareModelRef?: string;
  bindingRef?: string;
  runtimeRef?: string;
  auditorRef?: string;
  /** Payload opaco (nunca interpretado). */
  collectedPayload?: Readonly<Record<string, unknown>>;
  errors: readonly string[];
  warnings: readonly string[];
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  /** Explicitamente: nenhuma Engine foi invocada nesta fundação. */
  enginesInvoked: false;
  /** Explicitamente: orquestração exclusivamente via Ports. */
  orchestrationViaPortsOnly: true;
};

/** União de registros canônicos (documentação / tipagem auxiliar). */
export type CanonicalExecutionRecord =
  | CanonicalExecutionRequest
  | CanonicalExecutionContext
  | CanonicalExecutionStep
  | CanonicalExecutionResult
  | CanonicalExecutionTrace;
