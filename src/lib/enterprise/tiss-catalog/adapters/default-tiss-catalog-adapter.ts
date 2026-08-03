/**
 * DefaultTISSCatalogAdapter — TISS-02.
 *
 * Adapter oficial do Enterprise TISS Canonical Catalog.
 * Sem XML. Sem operadoras. Sem regras ANS. Sem acesso externo.
 *
 * Implementa: consultas canônicas, timeout, retry, cancelamento,
 * logging estrutural, telemetria estrutural.
 */
import { DEFAULT_TISS_CATALOG_CAPABILITIES } from "../ports/capabilities";
import { createTISSCatalogRequestId } from "../ports/identity";
import type { TISSCatalogPort } from "../ports/tiss-catalog-port";
import type { CanonicalTISSCatalog, CanonicalTISSCatalogStatistics } from "../ports/canonical";
import type {
  GetByCodeInput,
  GetCatalogInput,
  GetCatalogResult,
  GetDomainResult,
  GetGuideTypeResult,
  GetProcedureGroupResult,
  GetProcedureTypeResult,
  GetProfileResult,
  GetStatisticsInput,
  GetStatisticsResult,
  GetVersionResult,
  GetVocabularyEntryResult,
  ListCatalogEntriesInput,
  ListDomainsResult,
  ListGuideTypesResult,
  ListProcedureGroupsResult,
  ListProcedureTypesResult,
  ListProfilesResult,
  ListVersionsResult,
  ListVocabularyResult,
  ResolveReferenceInput,
  ResolveReferenceResult,
  TISSCatalogHealth,
  TISSCatalogInfo,
  TISSCatalogOperationEnvelope,
  TISSCatalogOperationalControls,
  TISSCatalogPortCapabilities,
  TISSCatalogProviderId,
  TISSCatalogProviderMetadata,
  TISSCatalogStructuredLog,
} from "../ports/types";
import { InMemoryTISSCatalog, type TISSCatalogStore } from "../store";

export const DEFAULT_TISS_CATALOG_ADAPTER_ID = "default-enterprise-tiss-catalog";
export const DEFAULT_TISS_CATALOG_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultTISSCatalogAdapterOptions = {
  provider?: Extract<TISSCatalogProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: TISSCatalogStore;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

type ListableEntry = {
  code: string;
  status?: string;
  tags?: readonly string[];
  category?: string;
};

function readSignal(input: TISSCatalogOperationalControls): AbortSignal | undefined {
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

function matchesList(entry: ListableEntry, input: ListCatalogEntriesInput): boolean {
  if (input.status != null && entry.status !== input.status) return false;
  if (input.tag != null && !(entry.tags ?? []).includes(input.tag)) return false;
  if (input.codePrefix != null && !entry.code.startsWith(input.codePrefix)) return false;
  if (input.category != null && entry.category !== input.category) return false;
  return true;
}

/**
 * Adapter oficial TISS-02 — TISS Catalog default / enterprise.
 */
export class DefaultTISSCatalogAdapter implements TISSCatalogPort {
  readonly providerId: Extract<TISSCatalogProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: TISSCatalogProviderMetadata;
  private readonly store: TISSCatalogStore;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultTISSCatalogAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} TISS catalog ready (canonical knowledge — no XML/operator/rules).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default TISS Catalog" : "Enterprise TISS Catalog",
      version: DEFAULT_TISS_CATALOG_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-02 Enterprise TISS Canonical Catalog — sole authorized TISS knowledge source.",
    };
    this.store = options.store ?? new InMemoryTISSCatalog();
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): TISSCatalogStore {
    return this.store;
  }

  capabilities(): TISSCatalogPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_TISS_CATALOG_ADAPTER_ID,
      catalog: { ...DEFAULT_TISS_CATALOG_CAPABILITIES },
      supportsCanonicalCatalog: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
    };
  }

  providerInfo(): TISSCatalogInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TISS_CATALOG",
      capabilities: { ...DEFAULT_TISS_CATALOG_CAPABILITIES },
    };
  }

  async health(): Promise<TISSCatalogHealth> {
    const storeHealth = this.store.health();
    return {
      ok: this.healthy && storeHealth.ok,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy && storeHealth.ok ? "ready" : "unhealthy",
      storedEntryCount: this.store.entryCount(),
      message: this.healthy ? (storeHealth.message ?? this.message) : "TISS catalog unhealthy.",
    };
  }

  async getCatalog(input: GetCatalogInput = {}): Promise<GetCatalogResult> {
    return this.runOperation("getCatalog", input, async () => {
      const catalog = this.buildCatalog();
      return { ok: true, catalog, code: "TISS_CATALOG_OK", message: "Canonical catalog loaded." };
    });
  }

  async getVersion(input: GetByCodeInput): Promise<GetVersionResult> {
    return this.runOperation("getVersion", input, async () => {
      const entry = this.store.getVersion(input.code);
      if (!entry) {
        return { ok: false, code: "TISS_CATALOG_NOT_FOUND", message: "version not found" };
      }
      return { ok: true, entry, code: "TISS_CATALOG_OK", message: "version found" };
    });
  }

  async listVersions(input: ListCatalogEntriesInput = {}): Promise<ListVersionsResult> {
    return this.runOperation("listVersions", input, async () => {
      const entries = this.store.listVersions().filter((entry) => matchesList(entry, input));
      return { ok: true, entries, code: "TISS_CATALOG_OK", message: "versions listed" };
    });
  }

  async getGuideType(input: GetByCodeInput): Promise<GetGuideTypeResult> {
    return this.runOperation("getGuideType", input, async () => {
      const entry = this.store.getGuideType(input.code);
      if (!entry) {
        return { ok: false, code: "TISS_CATALOG_NOT_FOUND", message: "guide type not found" };
      }
      return { ok: true, entry, code: "TISS_CATALOG_OK", message: "guide type found" };
    });
  }

  async listGuideTypes(input: ListCatalogEntriesInput = {}): Promise<ListGuideTypesResult> {
    return this.runOperation("listGuideTypes", input, async () => {
      const entries = this.store.listGuideTypes().filter((entry) => matchesList(entry, input));
      return { ok: true, entries, code: "TISS_CATALOG_OK", message: "guide types listed" };
    });
  }

  async getProcedureType(input: GetByCodeInput): Promise<GetProcedureTypeResult> {
    return this.runOperation("getProcedureType", input, async () => {
      const entry = this.store.getProcedureType(input.code);
      if (!entry) {
        return { ok: false, code: "TISS_CATALOG_NOT_FOUND", message: "procedure type not found" };
      }
      return { ok: true, entry, code: "TISS_CATALOG_OK", message: "procedure type found" };
    });
  }

  async listProcedureTypes(input: ListCatalogEntriesInput = {}): Promise<ListProcedureTypesResult> {
    return this.runOperation("listProcedureTypes", input, async () => {
      const entries = this.store.listProcedureTypes().filter((entry) => matchesList(entry, input));
      return { ok: true, entries, code: "TISS_CATALOG_OK", message: "procedure types listed" };
    });
  }

  async getProcedureGroup(input: GetByCodeInput): Promise<GetProcedureGroupResult> {
    return this.runOperation("getProcedureGroup", input, async () => {
      const entry = this.store.getProcedureGroup(input.code);
      if (!entry) {
        return {
          ok: false,
          code: "TISS_CATALOG_NOT_FOUND",
          message: "procedure group not found",
        };
      }
      return { ok: true, entry, code: "TISS_CATALOG_OK", message: "procedure group found" };
    });
  }

  async listProcedureGroups(
    input: ListCatalogEntriesInput = {},
  ): Promise<ListProcedureGroupsResult> {
    return this.runOperation("listProcedureGroups", input, async () => {
      const entries = this.store.listProcedureGroups().filter((entry) => matchesList(entry, input));
      return { ok: true, entries, code: "TISS_CATALOG_OK", message: "procedure groups listed" };
    });
  }

  async getDomain(input: GetByCodeInput): Promise<GetDomainResult> {
    return this.runOperation("getDomain", input, async () => {
      const entry = this.store.getDomain(input.code);
      if (!entry) {
        return { ok: false, code: "TISS_CATALOG_NOT_FOUND", message: "domain not found" };
      }
      return { ok: true, entry, code: "TISS_CATALOG_OK", message: "domain found" };
    });
  }

  async listDomains(input: ListCatalogEntriesInput = {}): Promise<ListDomainsResult> {
    return this.runOperation("listDomains", input, async () => {
      const entries = this.store.listDomains().filter((entry) => matchesList(entry, input));
      return { ok: true, entries, code: "TISS_CATALOG_OK", message: "domains listed" };
    });
  }

  async getProfile(input: GetByCodeInput): Promise<GetProfileResult> {
    return this.runOperation("getProfile", input, async () => {
      const entry = this.store.getProfile(input.code);
      if (!entry) {
        return { ok: false, code: "TISS_CATALOG_NOT_FOUND", message: "profile not found" };
      }
      return { ok: true, entry, code: "TISS_CATALOG_OK", message: "profile found" };
    });
  }

  async listProfiles(input: ListCatalogEntriesInput = {}): Promise<ListProfilesResult> {
    return this.runOperation("listProfiles", input, async () => {
      const entries = this.store.listProfiles().filter((entry) => matchesList(entry, input));
      return { ok: true, entries, code: "TISS_CATALOG_OK", message: "profiles listed" };
    });
  }

  async getVocabularyEntry(input: GetByCodeInput): Promise<GetVocabularyEntryResult> {
    return this.runOperation("getVocabularyEntry", input, async () => {
      const entry = this.store.getVocabularyEntry(input.code);
      if (!entry) {
        return {
          ok: false,
          code: "TISS_CATALOG_NOT_FOUND",
          message: "vocabulary entry not found",
        };
      }
      return { ok: true, entry, code: "TISS_CATALOG_OK", message: "vocabulary entry found" };
    });
  }

  async listVocabulary(input: ListCatalogEntriesInput = {}): Promise<ListVocabularyResult> {
    return this.runOperation("listVocabulary", input, async () => {
      const entries = this.store.listVocabulary().filter((entry) => matchesList(entry, input));
      return { ok: true, entries, code: "TISS_CATALOG_OK", message: "vocabulary listed" };
    });
  }

  async getStatistics(input: GetStatisticsInput = {}): Promise<GetStatisticsResult> {
    return this.runOperation("getStatistics", input, async () => {
      const statistics = this.buildStatistics();
      return { ok: true, statistics, code: "TISS_CATALOG_OK", message: "statistics computed" };
    });
  }

  async resolveReference(input: ResolveReferenceInput): Promise<ResolveReferenceResult> {
    return this.runOperation("resolveReference", input, async () => {
      let references = this.store.listReferences();
      if (input.referenceId) {
        const one = this.store.getReference(input.referenceId);
        references = one ? [one] : [];
      } else {
        if (input.sourceCode) {
          references = references.filter((ref) => ref.sourceCode === input.sourceCode);
        }
        if (input.targetCode) {
          references = references.filter((ref) => ref.targetCode === input.targetCode);
        }
      }
      return {
        ok: true,
        references,
        code: "TISS_CATALOG_OK",
        message: "references resolved",
      };
    });
  }

  private buildStatistics(): CanonicalTISSCatalogStatistics {
    const versions = this.store.listVersions();
    const guideTypes = this.store.listGuideTypes();
    const procedureTypes = this.store.listProcedureTypes();
    const procedureGroups = this.store.listProcedureGroups();
    const domains = this.store.listDomains();
    const profiles = this.store.listProfiles();
    const vocabulary = this.store.listVocabulary();
    const references = this.store.listReferences();
    return {
      kind: "canonical-tiss-catalog-statistics",
      entryKind: "statistics",
      catalogId: this.store.catalogId,
      versionCount: versions.length,
      guideTypeCount: guideTypes.length,
      procedureTypeCount: procedureTypes.length,
      procedureGroupCount: procedureGroups.length,
      domainCount: domains.length,
      profileCount: profiles.length,
      vocabularyEntryCount: vocabulary.length,
      referenceCount: references.length,
      totalEntries: this.store.entryCount(),
    };
  }

  private buildCatalog(): CanonicalTISSCatalog {
    const statistics = this.buildStatistics();
    return {
      kind: "canonical-tiss-catalog",
      entryKind: "catalog",
      catalogId: this.store.catalogId,
      name: "Enterprise TISS Canonical Catalog",
      description: "Official canonical TISS knowledge source (TISS-02).",
      status: "active",
      versions: this.store.listVersions(),
      guideTypes: this.store.listGuideTypes(),
      procedureTypes: this.store.listProcedureTypes(),
      procedureGroups: this.store.listProcedureGroups(),
      domains: this.store.listDomains(),
      profiles: this.store.listProfiles(),
      vocabulary: this.store.listVocabulary(),
      references: this.store.listReferences(),
      metadata: this.store.getMetadata(),
      statistics,
    };
  }

  private async runOperation<T extends { ok: boolean; code?: string; message?: string }>(
    operation: string,
    input: TISSCatalogOperationalControls,
    execute: () => Promise<T>,
  ): Promise<T & TISSCatalogOperationEnvelope> {
    const requestId = input.requestId ?? createTISSCatalogRequestId();
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
    const logs: TISSCatalogStructuredLog[] = [];

    const fail = (
      message: string,
      code: string,
      attempts: number,
    ): T & TISSCatalogOperationEnvelope => {
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
      } as unknown as T & TISSCatalogOperationEnvelope;
    };

    if (!this.healthy) {
      return fail("TISS catalog unhealthy.", "TISS_CATALOG_UNHEALTHY", 0);
    }

    if (signal?.aborted) {
      return fail("Operação TISS Catalog cancelada antes do início.", "TISS_CATALOG_CANCELLED", 0);
    }

    const maxAttempts = retryCount + 1;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) {
        return fail("Operação TISS Catalog cancelada.", "TISS_CATALOG_CANCELLED", attempt);
      }

      try {
        const outcome = await this.withTimeout(
          this.executeWithHooks(operation, requestId, attempt, logs, input, execute),
          timeoutMs,
          signal,
        );

        logs.push({
          level: "info",
          code: "TISS_CATALOG_OK",
          message: `TISS Catalog ${operation} completed.`,
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
          return fail(lastError, "TISS_CATALOG_CANCELLED", attempt);
        }
        if (/timeout/i.test(lastError)) {
          return fail(lastError, "TISS_CATALOG_TIMEOUT", attempt);
        }
        logs.push({
          level: "warn",
          code: "TISS_CATALOG_RETRY",
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
      lastError ?? "Operação TISS Catalog falhou após retries.",
      "TISS_CATALOG_FAILED",
      maxAttempts,
    );
  }

  private async executeWithHooks<T>(
    operation: string,
    requestId: string,
    attempt: number,
    logs: TISSCatalogStructuredLog[],
    input: TISSCatalogOperationalControls,
    execute: () => Promise<T>,
  ): Promise<T> {
    if (this.failAttemptsRemaining > 0) {
      this.failAttemptsRemaining -= 1;
      throw new Error(`Transient TISS Catalog failure (attempt ${attempt}, request ${requestId}).`);
    }

    void this.now();
    logs.push({
      level: "info",
      code: "TISS_CATALOG_START",
      message: `Starting TISS Catalog operation=${operation}.`,
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
            reject(new Error(`TISS Catalog timeout after ${timeoutMs}ms.`));
          }, timeoutMs);
          if (signal) {
            onAbort = () => reject(new Error("TISS Catalog cancelled."));
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

/** Alias oficial do adapter enterprise (TISS-02). */
export const EnterpriseTISSCatalogAdapter = DefaultTISSCatalogAdapter;
