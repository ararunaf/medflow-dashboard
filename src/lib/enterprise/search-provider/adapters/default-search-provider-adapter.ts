/**
 * DefaultSearchProviderAdapter — SEARCH-01.
 *
 * Adapter oficial de busca documental (também exportado como StorageBackedSearchProviderAdapter).
 * Backend documental exclusivamente via StorageProviderPort.
 * Sem Elastic / OpenSearch / Azure Search / Supabase / S3 / FS diretos.
 *
 * Implementa: busca por ID/documento/paciente/metadata/tenant/competência,
 * timeout, retry, cancelamento, logging estrutural, telemetria estrutural,
 * CanonicalSearchResult / CanonicalSearchDocument / CanonicalSearchMetadata.
 */
import type { StorageProviderPort } from "../../storage-provider/ports/storage-provider-port";
import { DEFAULT_SEARCH_PROVIDER_CAPABILITIES } from "../ports/capabilities";
import { createSearchProviderRequestId } from "../ports/identity";
import type { SearchProviderPort } from "../ports/search-provider-port";
import type { CanonicalSearchDocument } from "../ports/canonical";
import type {
  SearchProcessInput,
  SearchProviderConfigurationValidation,
  SearchProviderHealth,
  SearchProviderId,
  SearchProviderInfo,
  SearchProviderMetadata,
  SearchProviderOperationResult,
  SearchProviderPortCapabilities,
  SearchProviderStructuredLog,
} from "../ports/types";
import {
  createInMemorySearchCatalog,
  type InMemorySearchCatalog,
} from "./in-memory-search-catalog";

export const DEFAULT_SEARCH_PROVIDER_ADAPTER_ID = "default-storage-backed-search";
export const DEFAULT_SEARCH_PROVIDER_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultSearchProviderAdapterOptions = {
  provider?: Extract<SearchProviderId, "storage-backed" | "default">;
  healthy?: boolean;
  message?: string;
  storageProviderPort?: StorageProviderPort;
  catalog?: InMemorySearchCatalog;
  seedDocuments?: readonly CanonicalSearchDocument[];
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: SearchProcessInput): AbortSignal | undefined {
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

/**
 * Adapter oficial SEARCH-01 — Search Provider default / storage-backed.
 */
export class DefaultSearchProviderAdapter implements SearchProviderPort {
  readonly providerId: Extract<SearchProviderId, "storage-backed" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly storageProviderPort?: StorageProviderPort;
  private readonly catalog: InMemorySearchCatalog;
  private readonly metadata: SearchProviderMetadata;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultSearchProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "storage-backed";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} search provider ready (storage-backed, no external search engine).`;
    this.storageProviderPort = options.storageProviderPort;
    this.catalog = options.catalog ?? createInMemorySearchCatalog(options.seedDocuments ?? []);
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Search Provider"
          : "Storage-Backed Search Provider",
      version: DEFAULT_SEARCH_PROVIDER_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official SEARCH-01 storage-backed document search — StorageProviderPort only, no external search engines.",
    };
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Exposto para testes / indexação controlada via Port. */
  getCatalog(): InMemorySearchCatalog {
    return this.catalog;
  }

  capabilities(): SearchProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_SEARCH_PROVIDER_ADAPTER_ID,
      search: { ...DEFAULT_SEARCH_PROVIDER_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsStorageProviderBackend: true,
      supportsSearchById: true,
      supportsSearchByDocument: true,
      supportsSearchByPatient: true,
      supportsSearchByMetadata: true,
      supportsSearchByTenant: true,
      supportsSearchByCompetencia: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsExternalSearchEngine: false,
      implementsElasticsearch: false,
      implementsOpenSearch: false,
      implementsAzureSearch: false,
    };
  }

  providerInfo(): SearchProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_SEARCH",
      capabilities: { ...DEFAULT_SEARCH_PROVIDER_CAPABILITIES },
    };
  }

  async health(): Promise<SearchProviderHealth> {
    let storageProviderOk = true;
    if (this.storageProviderPort) {
      const storageHealth = await this.storageProviderPort.health();
      storageProviderOk = storageHealth.ok;
    }
    const ok = this.healthy && storageProviderOk;
    return {
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storageProviderOk,
      message: ok ? this.message : "Search provider unhealthy — ver StorageProviderPort / adapter.",
    };
  }

  async validateConfiguration(): Promise<SearchProviderConfigurationValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!this.storageProviderPort) {
      warnings.push(
        "StorageProviderPort não injetado — busca usa apenas catálogo in-memory (sem verificação Storage).",
      );
    }
    return {
      ok: errors.length === 0,
      provider: this.providerId,
      errors,
      warnings,
      message:
        errors.length === 0 ? "Storage-backed search provider ready." : "Configuração inválida.",
    };
  }

  async indexDocument(document: CanonicalSearchDocument): Promise<{
    ok: boolean;
    message?: string;
    code?: string;
  }> {
    if (!document?.documentId) {
      return { ok: false, message: "documentId é obrigatório.", code: "SEARCH_INVALID_INPUT" };
    }

    if (document.storageKey && this.storageProviderPort) {
      const meta = await this.storageProviderPort.metadata({
        key: document.storageKey,
        container: document.storageContainer,
        documentId: document.documentId,
        sessionId: document.metadata?.sessionId,
        tenantRef: document.tenantRef ?? document.metadata?.tenantRef,
      });
      if (!meta.ok) {
        return {
          ok: false,
          message: meta.message ?? "Documento não encontrado no Storage Provider.",
          code: meta.code ?? "SEARCH_STORAGE_NOT_FOUND",
        };
      }
    }

    this.catalog.upsert({
      ...document,
      kind: "canonical-search-document",
    });
    return {
      ok: true,
      message: "Documento indexado no catálogo de busca.",
      code: "SEARCH_INDEXED",
    };
  }

  async search(input: SearchProcessInput): Promise<SearchProviderOperationResult> {
    const requestId = input.requestId ?? createSearchProviderRequestId();
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
    const logs: SearchProviderStructuredLog[] = [];

    const fail = (
      message: string,
      code: string,
      attempts: number,
    ): SearchProviderOperationResult => {
      logs.push({
        level: "error",
        code,
        message,
        requestId,
        providerId: this.providerId,
        attempt: attempts,
        mode: input.mode,
      });
      return {
        kind: "canonical-search-result",
        ok: false,
        requestId,
        request: {
          kind: "canonical-search-request",
          mode: input.mode,
          metadata: input.metadata,
          documentId: input.documentId,
          patientId: input.patientId,
          tenantRef: input.tenantRef,
          competencia: input.competencia,
          metadataFilters: input.metadataFilters,
          query: input.query,
          storageKey: input.storageKey,
          storageContainer: input.storageContainer,
          documentKind: input.documentKind,
          limit: input.limit,
        },
        documents: [],
        totalCount: 0,
        metadata: input.metadata,
        message,
        code,
        realSearchExecuted: false,
        provider: this.providerId,
        simulated: false,
        telemetry: {
          latencyMs: Math.max(0, Date.now() - startedMs),
          attempts,
          cancelled: signal?.aborted === true,
          mode: input.mode,
          hitCount: 0,
          storageLookups: 0,
        },
        logs,
      };
    };

    if (!this.healthy) {
      return fail("Search provider unhealthy.", "SEARCH_UNHEALTHY", 0);
    }

    if (!input.mode || !input.metadata?.sessionId) {
      return fail("mode e metadata.sessionId são obrigatórios.", "SEARCH_INVALID_INPUT", 0);
    }

    if (signal?.aborted) {
      return fail("Busca cancelada antes do início.", "SEARCH_CANCELLED", 0);
    }

    const maxAttempts = retryCount + 1;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) {
        return fail("Busca cancelada.", "SEARCH_CANCELLED", attempt);
      }

      try {
        const outcome = await this.withTimeout(
          this.executeSearch(input, requestId, attempt, logs),
          timeoutMs,
          signal,
        );

        logs.push({
          level: "info",
          code: "SEARCH_OK",
          message: `Search ${input.mode} returned ${outcome.documents.length} document(s)`,
          requestId,
          providerId: this.providerId,
          attempt,
          mode: input.mode,
        });

        return {
          kind: "canonical-search-result",
          ok: true,
          requestId,
          request: outcome.request,
          documents: outcome.documents,
          totalCount: outcome.documents.length,
          metadata: input.metadata,
          message: `Storage-backed search completed (${input.mode}).`,
          code: "SEARCHED",
          realSearchExecuted: true,
          provider: this.providerId,
          simulated: false,
          telemetry: {
            latencyMs: Math.max(0, Date.now() - startedMs),
            attempts: attempt,
            cancelled: false,
            mode: input.mode,
            hitCount: outcome.documents.length,
            storageLookups: outcome.storageLookups,
          },
          logs,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (signal?.aborted || /cancel/i.test(lastError)) {
          return fail(lastError, "SEARCH_CANCELLED", attempt);
        }
        if (/timeout/i.test(lastError)) {
          return fail(lastError, "SEARCH_TIMEOUT", attempt);
        }
        logs.push({
          level: "warn",
          code: "SEARCH_RETRY",
          message: lastError,
          requestId,
          providerId: this.providerId,
          attempt,
          mode: input.mode,
        });
        if (attempt < maxAttempts) {
          await this.sleep(retryBackoffMs * attempt);
          continue;
        }
      }
    }

    return fail(lastError ?? "Busca falhou após retries.", "SEARCH_FAILED", maxAttempts);
  }

  private async executeSearch(
    input: SearchProcessInput,
    requestId: string,
    attempt: number,
    logs: SearchProviderStructuredLog[],
  ): Promise<{
    request: SearchProcessInput;
    documents: CanonicalSearchDocument[];
    storageLookups: number;
  }> {
    if (this.failAttemptsRemaining > 0) {
      this.failAttemptsRemaining -= 1;
      throw new Error(`Transient search failure (attempt ${attempt}, request ${requestId}).`);
    }

    void this.now();
    logs.push({
      level: "info",
      code: "SEARCH_START",
      message: `Starting storage-backed search mode=${input.mode}.`,
      requestId,
      providerId: this.providerId,
      attempt,
      mode: input.mode,
    });

    const forceDelayMs = readPositiveInt(input.attributes?.forceDelayMs, 0);
    if (forceDelayMs > 0) {
      await this.sleep(forceDelayMs);
    }

    // Auto-index do próprio pedido quando documentId + storageKey presentes (path Runtime).
    if (
      input.documentId &&
      (input.storageKey || input.mode === "by-id" || input.mode === "by-document")
    ) {
      const existing = this.catalog.getById(input.documentId);
      if (!existing) {
        this.catalog.upsert({
          kind: "canonical-search-document",
          documentId: input.documentId,
          patientId: input.patientId ?? input.metadata.patientId,
          tenantRef: input.tenantRef ?? input.metadata.tenantRef,
          competencia: input.competencia ?? input.metadata.competencia,
          storageKey: input.storageKey,
          storageContainer: input.storageContainer,
          documentKind: input.documentKind,
          metadata: input.metadata,
        });
      }
    }

    let documents = this.catalog.search(input);
    let storageLookups = 0;

    if (this.storageProviderPort && documents.length > 0) {
      const enriched: CanonicalSearchDocument[] = [];
      for (const doc of documents) {
        if (!doc.storageKey) {
          enriched.push(doc);
          continue;
        }
        storageLookups += 1;
        const meta = await this.storageProviderPort.metadata({
          key: doc.storageKey,
          container: doc.storageContainer,
          documentId: doc.documentId,
          sessionId: doc.metadata?.sessionId ?? input.metadata.sessionId,
          tenantRef: doc.tenantRef ?? input.metadata.tenantRef,
          signal: readSignal(input),
        });
        if (meta.ok) {
          enriched.push({
            ...doc,
            metadata: {
              kind: "canonical-search-metadata",
              sessionId: doc.metadata?.sessionId ?? input.metadata.sessionId,
              tenantRef: doc.tenantRef ?? input.metadata.tenantRef,
              correlationId: input.metadata.correlationId,
              channel: input.metadata.channel,
              tags: doc.metadata?.tags ?? input.metadata.tags,
              patientId: doc.patientId,
              competencia: doc.competencia,
              customAttributes: {
                ...(doc.metadata?.customAttributes ?? {}),
                storageEtag: meta.metadata?.etag ?? null,
                storageSizeBytes: meta.metadata?.sizeBytes ?? null,
                storageVerified: true,
              },
            },
          });
        }
        // Documento ausente no Storage é excluído do hit-set (fonte de verdade = Storage).
      }
      documents = enriched;
    }

    return { request: input, documents, storageLookups };
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
            reject(new Error(`Search timeout after ${timeoutMs}ms.`));
          }, timeoutMs);
          if (signal) {
            onAbort = () => reject(new Error("Search cancelled."));
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

/** Alias oficial do adapter storage-backed (SEARCH-01). */
export const StorageBackedSearchProviderAdapter = DefaultSearchProviderAdapter;
