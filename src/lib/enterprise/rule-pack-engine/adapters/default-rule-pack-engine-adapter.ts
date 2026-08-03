/**
 * DefaultRulePackEngineAdapter — TISS-03 / TISS-03A.
 *
 * Adapter oficial do Enterprise Rule Pack Engine.
 * Sem XML. Sem operadoras. Sem contratos. Sem tenants. Sem ANS.
 *
 * Implementa: load / interpret / execute, timeout, retry, cancelamento,
 * logging estrutural, telemetria estrutural, prioridade, expectedResult.
 * Conhecimento TISS exclusivamente via TISSCatalogPort.
 */
import type { TISSCatalogPort } from "../../tiss-catalog/ports/tiss-catalog-port";
import { DEFAULT_RULE_PACK_ENGINE_CAPABILITIES } from "../ports/capabilities";
import {
  createRulePackEngineRequestId,
  createRulePackExecutionId,
  createRulePackFindingId,
} from "../ports/identity";
import type { RulePackEnginePort } from "../ports/rule-pack-engine-port";
import type {
  CanonicalRule,
  CanonicalRuleAction,
  CanonicalRuleCondition,
  CanonicalRuleExecution,
  CanonicalRuleExecutionResult,
  CanonicalRuleFinding,
  CanonicalRulePack,
  CanonicalRulePackExpectedResult,
} from "../ports/canonical";
import type {
  ExecutePackInput,
  ExecutePackResult,
  GetExecutionInput,
  GetExecutionResult,
  InterpretPackInput,
  InterpretPackResult,
  ListExecutionsInput,
  ListExecutionsResult,
  ListPacksInput,
  ListPacksResult,
  LoadPackInput,
  LoadPackResult,
  RulePackEngineEnterpriseDeps,
  RulePackEngineHealth,
  RulePackEngineInfo,
  RulePackEngineOperationEnvelope,
  RulePackEngineOperationalControls,
  RulePackEnginePortCapabilities,
  RulePackEngineProviderId,
  RulePackEngineProviderMetadata,
  RulePackEngineStructuredLog,
} from "../ports/types";
import { InMemoryRulePackEngineStore, type RulePackEngineStore } from "../store";

export const DEFAULT_RULE_PACK_ENGINE_ADAPTER_ID = "default-enterprise-rule-pack-engine";
export const DEFAULT_RULE_PACK_ENGINE_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultRulePackEngineAdapterOptions = {
  provider?: Extract<RulePackEngineProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: RulePackEngineStore;
  enterpriseDeps: RulePackEngineEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: RulePackEngineOperationalControls): AbortSignal | undefined {
  if (input.signal instanceof AbortSignal) return input.signal;
  const attr = input.attributes?.signal;
  return attr instanceof AbortSignal ? attr : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return fallback;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesList(pack: CanonicalRulePack, input: ListPacksInput): boolean {
  if (input.status != null && pack.status !== input.status) return false;
  if (input.tag != null && !(pack.tags ?? []).includes(input.tag)) return false;
  if (input.codePrefix != null && !pack.code.startsWith(input.codePrefix)) return false;
  if (input.category != null && !(pack.categories ?? []).includes(input.category)) return false;
  return true;
}

/** Ordena regras por prioridade decrescente (maior primeiro); empate estável por código. */
function sortRulesByPriority(rules: readonly CanonicalRule[]): CanonicalRule[] {
  return [...rules].sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa;
    return a.code.localeCompare(b.code);
  });
}

/**
 * Avalia expectedResult estrutural do pack contra o resultado canônico.
 * Sem semântica de negócio — apenas limiares estruturais.
 */
function evaluateExpectedResult(
  expected: CanonicalRulePackExpectedResult | undefined,
  result: Omit<CanonicalRuleExecutionResult, "expectedResultMet">,
): boolean | undefined {
  if (!expected) return undefined;

  if (expected.minRulesMatched != null && result.rulesMatched < expected.minRulesMatched) {
    return false;
  }
  if (expected.minFindings != null && result.findings.length < expected.minFindings) {
    return false;
  }
  if (expected.status != null && result.status !== expected.status) {
    return false;
  }
  if (expected.expectedAttributeKeys && expected.expectedAttributeKeys.length > 0) {
    const presentKeys = new Set<string>();
    for (const finding of result.findings) {
      for (const key of Object.keys(finding.attributes ?? {})) {
        presentKeys.add(key);
      }
    }
    for (const key of expected.expectedAttributeKeys) {
      if (!presentKeys.has(key)) return false;
    }
  }
  return true;
}

/**
 * Resolve existência de entrada do catálogo via TISSCatalogPort.
 * Dispatch estrutural por entryKind — sem branching por operadora/versão/tenant.
 */
async function catalogEntryExists(
  catalog: TISSCatalogPort,
  condition: CanonicalRuleCondition,
  controls: RulePackEngineOperationalControls,
): Promise<{ exists: boolean; catalogId?: string }> {
  const code = condition.catalogCode;
  if (!code) return { exists: false };

  const op = {
    requestId: controls.requestId,
    signal: controls.signal,
    timeoutMs: controls.timeoutMs,
    retryCount: controls.retryCount,
  };

  const entryKind = condition.catalogEntryKind ?? "profile";

  if (entryKind === "version") {
    const result = await catalog.getVersion({ ...op, code });
    return { exists: result.ok === true && result.entry != null };
  }
  if (entryKind === "guide-type") {
    const result = await catalog.getGuideType({ ...op, code });
    return { exists: result.ok === true && result.entry != null };
  }
  if (entryKind === "procedure-type") {
    const result = await catalog.getProcedureType({ ...op, code });
    return { exists: result.ok === true && result.entry != null };
  }
  if (entryKind === "procedure-group") {
    const result = await catalog.getProcedureGroup({ ...op, code });
    return { exists: result.ok === true && result.entry != null };
  }
  if (entryKind === "domain") {
    const result = await catalog.getDomain({ ...op, code });
    return { exists: result.ok === true && result.entry != null };
  }
  if (entryKind === "profile") {
    const result = await catalog.getProfile({ ...op, code });
    return { exists: result.ok === true && result.entry != null };
  }
  if (entryKind === "vocabulary-entry") {
    const result = await catalog.getVocabularyEntry({ ...op, code });
    return { exists: result.ok === true && result.entry != null };
  }

  const refs = await catalog.resolveReference({ ...op, sourceCode: code });
  return { exists: refs.ok === true && refs.references.length > 0 };
}

async function evaluateCondition(
  condition: CanonicalRuleCondition,
  catalog: TISSCatalogPort,
  controls: RulePackEngineOperationalControls,
): Promise<{ matched: boolean; catalogCode?: string }> {
  if (condition.conditionType === "always") {
    return { matched: true };
  }

  if (condition.conditionType === "metadata-attribute-present") {
    const key = condition.metadataKey;
    if (!key) return { matched: false };
    const attrs = controls.attributes ?? {};
    const present = Object.prototype.hasOwnProperty.call(attrs, key);
    if (!present) return { matched: false };
    if (condition.expectedValue === undefined) return { matched: true };
    return { matched: attrs[key] === condition.expectedValue };
  }

  if (condition.conditionType === "catalog-entry-exists") {
    const resolved = await catalogEntryExists(catalog, condition, controls);
    return {
      matched: resolved.exists,
      catalogCode: condition.catalogCode,
    };
  }

  // Tipos desconhecidos: não casam (extensível sem falha dura).
  return { matched: false };
}

function applyAction(
  action: CanonicalRuleAction,
  rule: CanonicalRule,
  matched: boolean,
  catalogCodes: readonly string[],
): CanonicalRuleFinding {
  const attributes: Record<string, string | number | boolean | null> = {};
  if (action.actionType === "record-attribute" && action.attributeKey != null) {
    attributes[action.attributeKey] = action.attributeValue ?? true;
  }
  if (action.actionType === "set-status") {
    attributes.status = action.attributeValue ?? "structural";
  }

  return {
    kind: "canonical-rule-finding",
    findingId: createRulePackFindingId(),
    ruleId: rule.id,
    ruleCode: rule.code,
    actionId: action.id,
    actionType: action.actionType,
    severity: action.severity ?? rule.severity,
    message: action.message,
    matched,
    catalogCodesResolved: catalogCodes,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
  };
}

/**
 * Adapter oficial TISS-03 — Rule Pack Engine default / enterprise.
 */
export class DefaultRulePackEngineAdapter implements RulePackEnginePort {
  readonly providerId: Extract<RulePackEngineProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: RulePackEngineProviderMetadata;
  private readonly store: RulePackEngineStore;
  private readonly enterpriseDeps: RulePackEngineEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultRulePackEngineAdapterOptions) {
    if (!options.enterpriseDeps?.getTISSCatalogPort) {
      throw new Error(
        "DefaultRulePackEngineAdapter exige enterpriseDeps.getTISSCatalogPort. " +
          "Bypass / implementação paralela é proibida.",
      );
    }
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Rule Pack Engine ready (structural — no XML/operator/contract/tenant).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default Rule Pack Engine" : "Enterprise Rule Pack Engine",
      version: DEFAULT_RULE_PACK_ENGINE_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-03 Enterprise Rule Pack Engine — generic pack interpretation via TISSCatalogPort.",
    };
    this.store = options.store ?? new InMemoryRulePackEngineStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): RulePackEngineStore {
    return this.store;
  }

  capabilities(): RulePackEnginePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_RULE_PACK_ENGINE_ADAPTER_ID,
      engine: { ...DEFAULT_RULE_PACK_ENGINE_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      consumesTISSCatalogPort: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
    };
  }

  providerInfo(): RulePackEngineInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "RULE_PACK_ENGINE",
      capabilities: { ...DEFAULT_RULE_PACK_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<RulePackEngineHealth> {
    const storeHealth = this.store.health();
    let tissCatalogOk = false;
    try {
      const catalogHealth = await this.enterpriseDeps.getTISSCatalogPort().health();
      tissCatalogOk = catalogHealth.ok === true;
    } catch {
      tissCatalogOk = false;
    }
    return {
      ok: this.healthy && storeHealth.ok && tissCatalogOk,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy && storeHealth.ok && tissCatalogOk ? "ready" : "unhealthy",
      storedPackCount: this.store.packCount(),
      tissCatalogOk,
      message: this.healthy ? (storeHealth.message ?? this.message) : "Rule Pack Engine unhealthy.",
    };
  }

  async loadPack(input: LoadPackInput): Promise<LoadPackResult> {
    return this.runOperation("loadPack", input, async () => {
      const pack = this.resolvePack(input.packId, input.code);
      if (!pack) {
        return { ok: false, code: "RULE_PACK_ENGINE_NOT_FOUND", message: "rule pack not found" };
      }
      return { ok: true, pack, code: "RULE_PACK_ENGINE_OK", message: "Rule pack loaded." };
    });
  }

  async listPacks(input: ListPacksInput = {}): Promise<ListPacksResult> {
    return this.runOperation("listPacks", input, async () => {
      const packs = this.store
        .listPacks()
        .filter((pack) => matchesList(pack, input))
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      return {
        ok: true,
        packs,
        code: "RULE_PACK_ENGINE_OK",
        message: `Listed ${packs.length} rule packs.`,
      };
    });
  }
  async interpretPack(input: InterpretPackInput): Promise<InterpretPackResult> {
    return this.runOperation("interpretPack", input, async () => {
      const pack = this.resolvePack(input.packId, input.code);
      if (!pack) {
        return {
          ok: false,
          catalogConsumed: false,
          code: "RULE_PACK_ENGINE_NOT_FOUND",
          message: "rule pack not found",
        };
      }

      const catalog = this.enterpriseDeps.getTISSCatalogPort();
      const catalogResult = await catalog.getCatalog({
        requestId: input.requestId,
        signal: input.signal,
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
      });

      const resolvedCatalogCodes: string[] = [];
      if (catalogResult.ok && catalogResult.catalog) {
        for (const code of pack.catalogProfileCodes ?? []) {
          const profile = await catalog.getProfile({ code, requestId: input.requestId });
          if (profile.ok && profile.entry) resolvedCatalogCodes.push(code);
        }
        for (const code of pack.catalogDomainCodes ?? []) {
          const domain = await catalog.getDomain({ code, requestId: input.requestId });
          if (domain.ok && domain.entry) resolvedCatalogCodes.push(code);
        }
        // Compatibilidade multi-versão: códigos opacos via TISSCatalogPort (sem if/switch versão).
        for (const code of pack.compatibleTissVersionCodes ?? []) {
          const version = await catalog.getVersion({ code, requestId: input.requestId });
          if (version.ok && version.entry) resolvedCatalogCodes.push(code);
        }
        for (const rule of pack.rules) {
          for (const condition of rule.conditions) {
            if (condition.catalogCode) {
              const exists = await catalogEntryExists(catalog, condition, input);
              if (exists.exists) resolvedCatalogCodes.push(condition.catalogCode);
            }
          }
        }
      }

      return {
        ok: true,
        pack,
        resolvedCatalogCodes: Array.from(new Set(resolvedCatalogCodes)),
        catalogId: catalogResult.catalog?.catalogId,
        catalogConsumed: catalogResult.ok === true,
        code: "RULE_PACK_ENGINE_OK",
        message: "Rule pack interpreted via TISSCatalogPort.",
      };
    });
  }

  async executePack(input: ExecutePackInput): Promise<ExecutePackResult> {
    return this.runOperation("executePack", input, async () => {
      const pack = this.resolvePack(input.packId, input.code);
      if (!pack) {
        return {
          ok: false,
          code: "RULE_PACK_ENGINE_NOT_FOUND",
          message: "rule pack not found",
        };
      }

      const stamp = this.now();
      const executionId = createRulePackExecutionId();
      const catalog = this.enterpriseDeps.getTISSCatalogPort();
      const catalogResult = await catalog.getCatalog({
        requestId: input.requestId,
        signal: input.signal,
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
      });
      const catalogConsumed = catalogResult.ok === true;
      const catalogId = catalogResult.catalog?.catalogId;

      let rulesEvaluated = 0;
      let rulesMatched = 0;
      const findings: CanonicalRuleFinding[] = [];

      const enabledRules = sortRulesByPriority(
        pack.rules.filter((rule) => rule.status == null || rule.status === "enabled"),
      );

      for (const rule of enabledRules) {
        rulesEvaluated += 1;
        const catalogCodes: string[] = [];
        let allMatched = true;

        for (const condition of rule.conditions) {
          const evaluation = await evaluateCondition(condition, catalog, input);
          if (evaluation.catalogCode) catalogCodes.push(evaluation.catalogCode);
          if (!evaluation.matched) {
            allMatched = false;
            break;
          }
        }

        if (allMatched) {
          rulesMatched += 1;
          for (const action of rule.actions) {
            findings.push(applyAction(action, rule, true, catalogCodes));
          }
        }
      }

      const resultBase = {
        kind: "canonical-rule-execution-result" as const,
        ok: true,
        packId: pack.packId,
        packCode: pack.code,
        rulesEvaluated,
        rulesMatched,
        findings,
        catalogId,
        catalogConsumed,
        status: "completed" as const,
        message: "Rule pack executed structurally via TISSCatalogPort.",
        code: "RULE_PACK_ENGINE_OK",
      };
      const expectedResultMet = evaluateExpectedResult(pack.expectedResult, resultBase);
      const result: CanonicalRuleExecutionResult = {
        ...resultBase,
        expectedResultMet,
      };

      const execution: CanonicalRuleExecution = {
        kind: "canonical-rule-execution",
        executionId,
        packId: pack.packId,
        packCode: pack.code,
        status: "completed",
        requestId: input.requestId,
        catalogId,
        catalogConsumed,
        result,
        createdAt: stamp,
        updatedAt: this.now(),
        message: result.message,
        code: result.code,
      };
      this.store.setExecution(execution);

      return {
        ok: true,
        execution,
        result,
        code: "RULE_PACK_ENGINE_OK",
        message: result.message,
      };
    });
  }

  async getExecution(input: GetExecutionInput): Promise<GetExecutionResult> {
    return this.runOperation("getExecution", input, async () => {
      const execution = this.store.getExecution(input.executionId);
      if (!execution) {
        return {
          ok: false,
          code: "RULE_PACK_ENGINE_NOT_FOUND",
          message: "execution not found",
        };
      }
      return {
        ok: true,
        execution,
        code: "RULE_PACK_ENGINE_OK",
        message: "Execution loaded.",
      };
    });
  }

  async listExecutions(input: ListExecutionsInput = {}): Promise<ListExecutionsResult> {
    return this.runOperation("listExecutions", input, async () => {
      let executions = this.store.listExecutions();
      if (input.packId != null) {
        executions = executions.filter((item) => item.packId === input.packId);
      }
      if (input.status != null) {
        executions = executions.filter((item) => item.status === input.status);
      }
      return {
        ok: true,
        executions,
        code: "RULE_PACK_ENGINE_OK",
        message: `Listed ${executions.length} executions.`,
      };
    });
  }

  private resolvePack(packId?: string, code?: string): CanonicalRulePack | undefined {
    if (packId) return this.store.getPack(packId);
    if (code) return this.store.getPackByCode(code);
    // Default: primeiro pack ativo estrutural (sem preferência de domínio).
    return (
      this.store.listPacks().find((pack) => pack.status === "active") ?? this.store.listPacks()[0]
    );
  }

  private async runOperation<T extends { ok: boolean; code?: string; message?: string }>(
    operation: string,
    input: RulePackEngineOperationalControls,
    execute: () => Promise<T>,
  ): Promise<T & RulePackEngineOperationEnvelope> {
    const requestId = input.requestId ?? createRulePackEngineRequestId();
    const startedMs = Date.now();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(
      input.timeoutMs ?? input.attributes?.timeoutMs,
      this.defaultTimeoutMs,
    );
    const retryCount = readPositiveInt(
      input.retryCount ?? input.attributes?.retryCount,
      this.defaultRetryCount,
    );
    const retryBackoffMs = readPositiveInt(
      input.attributes?.retryBackoffMs,
      this.defaultRetryBackoffMs,
    );
    const logs: RulePackEngineStructuredLog[] = [];

    const fail = (
      message: string,
      code: string,
      attempts: number,
    ): T & RulePackEngineOperationEnvelope => {
      logs.push({
        level: "error",
        code,
        message,
        requestId,
        providerId: this.providerId,
        attempt: attempts,
        operation,
      });
      return {
        ok: false,
        requestId,
        message,
        code,
        provider: this.providerId,
        simulated: false,
        telemetry: {
          latencyMs: Math.max(0, Date.now() - startedMs),
          attempts,
          cancelled: signal?.aborted === true,
          operation,
        },
        logs,
      } as unknown as T & RulePackEngineOperationEnvelope;
    };

    if (!this.healthy) {
      return fail("Rule Pack Engine unhealthy.", "RULE_PACK_ENGINE_UNHEALTHY", 0);
    }

    if (signal?.aborted) {
      return fail(
        "Operação Rule Pack Engine cancelada antes do início.",
        "RULE_PACK_ENGINE_CANCELLED",
        0,
      );
    }

    const maxAttempts = retryCount + 1;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) {
        return fail("Operação Rule Pack Engine cancelada.", "RULE_PACK_ENGINE_CANCELLED", attempt);
      }

      try {
        const outcome = await this.withTimeout(
          this.executeWithHooks(operation, requestId, attempt, logs, input, execute),
          timeoutMs,
          signal,
        );

        logs.push({
          level: "info",
          code: "RULE_PACK_ENGINE_OK",
          message: `Rule Pack Engine ${operation} completed.`,
          requestId,
          providerId: this.providerId,
          attempt,
          operation,
        });

        return {
          ...outcome,
          requestId,
          provider: this.providerId,
          simulated: false,
          telemetry: {
            latencyMs: Math.max(0, Date.now() - startedMs),
            attempts: attempt,
            cancelled: false,
            operation,
          },
          logs,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (signal?.aborted || /cancel/i.test(lastError)) {
          return fail(lastError, "RULE_PACK_ENGINE_CANCELLED", attempt);
        }
        if (/timeout/i.test(lastError)) {
          return fail(lastError, "RULE_PACK_ENGINE_TIMEOUT", attempt);
        }
        logs.push({
          level: "warn",
          code: "RULE_PACK_ENGINE_RETRY",
          message: lastError,
          requestId,
          providerId: this.providerId,
          attempt,
          operation,
        });
        if (attempt < maxAttempts) {
          await this.sleep(retryBackoffMs * attempt);
          continue;
        }
      }
    }

    return fail(
      lastError ?? "Operação Rule Pack Engine falhou após retries.",
      "RULE_PACK_ENGINE_FAILED",
      maxAttempts,
    );
  }

  private async executeWithHooks<T>(
    operation: string,
    requestId: string,
    attempt: number,
    logs: RulePackEngineStructuredLog[],
    input: RulePackEngineOperationalControls,
    execute: () => Promise<T>,
  ): Promise<T> {
    if (this.failAttemptsRemaining > 0) {
      this.failAttemptsRemaining -= 1;
      throw new Error(
        `Transient Rule Pack Engine failure (attempt ${attempt}, request ${requestId}).`,
      );
    }

    void this.now();
    logs.push({
      level: "info",
      code: "RULE_PACK_ENGINE_START",
      message: `Starting Rule Pack Engine operation=${operation}.`,
      requestId,
      providerId: this.providerId,
      attempt,
      operation,
    });

    const forceDelayMs = readPositiveInt(input.attributes?.forceDelayMs, 0);
    if (forceDelayMs > 0) {
      await this.sleep(forceDelayMs);
    }

    return execute();
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal: AbortSignal | undefined,
  ): Promise<T> {
    if (timeoutMs <= 0) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Rule Pack Engine timeout after ${timeoutMs}ms.`));
          }, timeoutMs);
          if (signal) {
            onAbort = () => reject(new Error("Rule Pack Engine cancelled."));
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
          }
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    }
  }
}

/** Alias oficial do adapter enterprise (TISS-03). */
export const EnterpriseRulePackEngineAdapter = DefaultRulePackEngineAdapter;
