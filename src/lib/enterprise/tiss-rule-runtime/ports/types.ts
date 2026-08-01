/**
 * Tipos vendor-agnósticos do TISS Rule Runtime — EPC-23.
 *
 * O Runtime apenas orquestra o pipeline Enterprise.
 * NÃO executa regras. NÃO valida TISS. NÃO interpreta contratos.
 * NÃO conhece OCR, AI, parser XML, banco, APIs ou UI.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → TISSRuleRuntimePort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionMetadata,
  ExecutionPipeline,
  ExecutionResult,
  ExecutionStatus,
  ExecutionTrace,
  TISSExecutionContext,
} from "./models";

export type {
  ExecutionMetadata,
  ExecutionPipeline,
  ExecutionRecord,
  ExecutionRecordKind,
  ExecutionResult,
  ExecutionStage,
  ExecutionStageName,
  ExecutionStatus,
  ExecutionTrace,
  RuntimeVersionFamily,
  TISSExecutionContext,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do TISS Rule Runtime (extensível). */
export type TISSRuleRuntimeProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — startExecution
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada de início de execução — recebe exclusivamente Healthcare Model ref. */
export type StartExecutionInput = {
  /** Referência opaca ao Healthcare Model (entrada exclusiva). */
  healthcareModelRef: string;
  correlationId?: string;
  tenantRef?: string;
  channel?: string;
  tags?: readonly string[];
  metadata?: Omit<ExecutionMetadata, "kind" | "id" | "executionId">;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  structuralNotes?: string;
};

/** Resultado estrutural de startExecution. */
export type StartExecutionResult = {
  ok: boolean;
  context?: TISSExecutionContext;
  pipeline?: ExecutionPipeline;
  trace?: ExecutionTrace;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — resolveProfile
 * ───────────────────────────────────────────────────────────────────────── */

export type ResolveProfileInput = {
  executionId: string;
  /** Referência estrutural opcional ao Profile (sem lookup real). */
  profileRef?: string;
};

export type ResolveProfileResult = {
  ok: boolean;
  executionId?: string;
  profileRef?: string;
  stageStatus?: ExecutionStatus;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — resolveBindings
 * ───────────────────────────────────────────────────────────────────────── */

export type ResolveBindingsInput = {
  executionId: string;
  /** Referências estruturais opcionais a Contract Rule Bindings. */
  bindingRefs?: readonly string[];
};

export type ResolveBindingsResult = {
  ok: boolean;
  executionId?: string;
  bindingRefs?: readonly string[];
  stageStatus?: ExecutionStatus;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — resolveRulePacks
 * ───────────────────────────────────────────────────────────────────────── */

export type ResolveRulePacksInput = {
  executionId: string;
  /** Referências estruturais opcionais a Rule Packs. */
  rulePackRefs?: readonly string[];
};

export type ResolveRulePacksResult = {
  ok: boolean;
  executionId?: string;
  rulePackRefs?: readonly string[];
  stageStatus?: ExecutionStatus;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — dispatchRules
 * ───────────────────────────────────────────────────────────────────────── */

export type DispatchRulesInput = {
  executionId: string;
  /** Referência estrutural opcional do despacho (sem execução real). */
  ruleDispatchRef?: string;
};

export type DispatchRulesResult = {
  ok: boolean;
  executionId?: string;
  ruleDispatchRef?: string;
  stageStatus?: ExecutionStatus;
  /** Explicitamente: nenhuma regra foi executada nesta fundação. */
  rulesExecuted: false;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — collectResults
 * ───────────────────────────────────────────────────────────────────────── */

export type CollectResultsInput = {
  executionId: string;
  /** Payload opaco coletado (nunca interpretado). */
  collectedPayload?: Readonly<Record<string, unknown>>;
};

export type CollectResultsResult = {
  ok: boolean;
  executionId?: string;
  result?: ExecutionResult;
  trace?: ExecutionTrace;
  context?: TISSExecutionContext;
  pipeline?: ExecutionPipeline;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type TISSRuleRuntimeHealth = {
  ok: boolean;
  provider: TISSRuleRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  storedContextCount?: number;
  storedPipelineCount?: number;
  storedResultCount?: number;
  storedTraceCount?: number;
  storedMetadataCount?: number;
};

/**
 * Capacidades do TISSRuleRuntimePort (FASE 8 — somente estrutura).
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type TISSRuleRuntimeCapabilities = {
  provider: TISSRuleRuntimeProviderId;
  adapterId: string;
  supportsStartExecution: boolean;
  supportsResolveProfile: boolean;
  supportsResolveBindings: boolean;
  supportsResolveRulePacks: boolean;
  supportsDispatchRules: boolean;
  supportsCollectResults: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  /** FASE 8 — capacidades estruturais (sem implementação funcional). */
  supportsParallelExecution: true;
  supportsBatchExecution: true;
  supportsVersioning: true;
  supportsTracing: true;
  supportsRollback: true;
  supportsRetry: true;
  /** Runtime recebe exclusivamente Healthcare Model. */
  receivesHealthcareModelOnly: true;
  /** Runtime resolve TISS Profile (estrutural). */
  resolvesTissProfile: true;
  /** Runtime resolve Contract Rule Binding (estrutural). */
  resolvesContractRuleBinding: true;
  /** Runtime encaminha Rule Packs ao Rule Engine (estrutural). */
  forwardsRulePacksToRuleEngine: true;
  /** Runtime coleta resultados sem interpretá-los. */
  collectsResultsWithoutInterpretation: true;
  /** Prep — AI Auditor (sem integração). */
  supportsFutureAiAuditor: true;
  /** Prep — Expression Engine (sem integração). */
  supportsFutureExpressionEngine: true;
  /** Prep — OCR (sem integração). */
  supportsFutureOcr: true;
  /** Prep — Contract Foundation (sem integração). */
  supportsFutureContractFoundation: true;
  /** Explicitamente sem execução de regras nesta fundação. */
  implementsRuleExecution: false;
  /** Explicitamente sem validação TISS nesta fundação. */
  implementsTissValidation: false;
  /** Explicitamente sem contratos específicos nesta fundação. */
  implementsSpecificContracts: false;
  /** Explicitamente sem ANS nesta fundação. */
  implementsAnsValidation: false;
  /** Explicitamente sem OCR nesta fundação. */
  implementsOcr: false;
  /** Explicitamente sem AI nesta fundação. */
  implementsAi: false;
  /** Explicitamente sem parser XML nesta fundação. */
  implementsXmlParser: false;
  /** Explicitamente sem banco / migrations nesta fundação. */
  implementsPersistence: false;
  /** Explicitamente sem Workflow clínico nesta fundação. */
  implementsClinicalWorkflow: false;
  /** Runtime apenas orquestra — sem inteligência de negócio. */
  orchestrationOnly: true;
};

/** Opções de resolução do TISSRuleRuntimePort (provider factory). */
export type TISSRuleRuntimeProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultTISSRuleRuntimeAdapter).
   */
  provider?: TISSRuleRuntimeProviderId;
};
