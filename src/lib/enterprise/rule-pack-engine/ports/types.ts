/**
 * Tipos vendor-agnósticos do Enterprise Rule Pack Engine — TISS-03.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort → Adapter → Rule Pack Store
 *
 * Sem XML. Sem operadoras. Sem contratos. Sem tenants.
 * Conhecimento TISS exclusivamente via TISSCatalogPort.
 */
import type {
  CanonicalRuleExecution,
  CanonicalRuleExecutionResult,
  CanonicalRulePack,
} from "./canonical";
import type { RulePackEngineCapabilities } from "./capabilities";
import type { TISSCatalogPort } from "../../tiss-catalog/ports/tiss-catalog-port";

export type {
  CanonicalRule,
  CanonicalRuleAction,
  CanonicalRuleCondition,
  CanonicalRuleExecution,
  CanonicalRuleExecutionResult,
  CanonicalRuleExecutionStatus,
  CanonicalRuleFinding,
  CanonicalRulePack,
  CanonicalRulePackExpectedResult,
  CanonicalRulePackMetadata,
  CanonicalRulePackStatus,
  CanonicalRuleSeverity,
  CanonicalRuleStatus,
} from "./canonical";
export type { RulePackEngineCapabilities };

/** Provedores / mecanismos do Rule Pack Engine. */
export type RulePackEngineProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type RulePackEngineStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type RulePackEngineTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type RulePackEngineStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: RulePackEngineProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type RulePackEngineHealth = {
  ok: boolean;
  provider: RulePackEngineProviderId;
  latencyMs?: number;
  message?: string;
  status?: RulePackEngineStatus;
  storedPackCount?: number;
  tissCatalogOk?: boolean;
};

/** Capacidades do adapter no nível do Port. */
export type RulePackEnginePortCapabilities = {
  provider: RulePackEngineProviderId;
  adapterId: string;
  engine: RulePackEngineCapabilities;
  supportsCanonicalResult: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  consumesTISSCatalogPort: boolean;
  implementsRealXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};

/** Metadados estáveis do provedor. */
export type RulePackEngineProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type RulePackEngineInfo = {
  providerId: RulePackEngineProviderId;
  metadata: RulePackEngineProviderMetadata;
  status: RulePackEngineStatus;
  providerType: "RULE_PACK_ENGINE";
  capabilities: RulePackEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type RulePackEngineOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type RulePackEngineOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: RulePackEngineProviderId;
  telemetry: RulePackEngineTelemetry;
  logs?: readonly RulePackEngineStructuredLog[];
  simulated?: boolean;
};

export type LoadPackInput = RulePackEngineOperationalControls & {
  packId?: string;
  code?: string;
};
export type LoadPackResult = RulePackEngineOperationEnvelope & {
  pack?: CanonicalRulePack;
};

export type ListPacksInput = RulePackEngineOperationalControls & {
  status?: string;
  tag?: string;
  codePrefix?: string;
  /** Filtra por categoria estrutural do pack (TISS-03A). */
  category?: string;
};
export type ListPacksResult = RulePackEngineOperationEnvelope & {
  packs: readonly CanonicalRulePack[];
};

export type InterpretPackInput = RulePackEngineOperationalControls & {
  packId?: string;
  code?: string;
};
export type InterpretPackResult = RulePackEngineOperationEnvelope & {
  pack?: CanonicalRulePack;
  /** Códigos de catálogo resolvidos via TISSCatalogPort. */
  resolvedCatalogCodes?: readonly string[];
  catalogId?: string;
  catalogConsumed: boolean;
};

export type ExecutePackInput = RulePackEngineOperationalControls & {
  packId?: string;
  code?: string;
};
export type ExecutePackResult = RulePackEngineOperationEnvelope & {
  execution?: CanonicalRuleExecution;
  result?: CanonicalRuleExecutionResult;
};

export type GetExecutionInput = RulePackEngineOperationalControls & {
  executionId: string;
};
export type GetExecutionResult = RulePackEngineOperationEnvelope & {
  execution?: CanonicalRuleExecution;
};

export type ListExecutionsInput = RulePackEngineOperationalControls & {
  packId?: string;
  status?: string;
};
export type ListExecutionsResult = RulePackEngineOperationEnvelope & {
  executions: readonly CanonicalRuleExecution[];
};

/** Dependências Enterprise injetadas no adapter. */
export type RulePackEngineEnterpriseDeps = {
  /** Única fonte autorizada de conhecimento TISS. */
  getTISSCatalogPort(): TISSCatalogPort;
};

/** Opções de resolução do RulePackEnginePort. */
export type RulePackEngineOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-03).
   */
  provider?: RulePackEngineProviderId;
  enterpriseDeps?: RulePackEngineEnterpriseDeps;
};

/** Entrada de registro no RulePackEngineRegistry. */
export type RulePackEngineRegistration = {
  providerId: RulePackEngineProviderId;
  name: string;
  version: string;
  status: RulePackEngineStatus;
  adapterId: string;
  vendor: string;
  capabilities: RulePackEngineCapabilities;
  description?: string;
};
