/**
 * DefaultTISSProviderAdapter — TISS-01.
 *
 * Adapter oficial da infraestrutura Enterprise TISS.
 * Sem XML real. Sem envio a operadoras. Sem validações clínicas/ANS.
 * Sem acesso a banco / Storage / OCR.
 *
 * Implementa: process estrutural, resolve profile/provider (referências opacas),
 * timeout, retry, cancelamento, logging estrutural, telemetria estrutural,
 * CanonicalTISSResult / CanonicalTISSMetadata / Profile/Provider references.
 */
import { DEFAULT_TISS_PROVIDER_CAPABILITIES } from "../ports/capabilities";
import { createTISSProviderRequestId } from "../ports/identity";
import type { TISSProviderPort } from "../ports/tiss-provider-port";
import type {
  CanonicalTISSProfileReference,
  CanonicalTISSProviderReference,
  CanonicalTISSRequest,
} from "../ports/canonical";
import type {
  TISSProcessInput,
  TISSProviderConfigurationValidation,
  TISSProviderHealth,
  TISSProviderId,
  TISSProviderInfo,
  TISSProviderMetadata,
  TISSProviderOperationResult,
  TISSProviderPortCapabilities,
  TISSProviderStructuredLog,
} from "../ports/types";

export const DEFAULT_TISS_PROVIDER_ADAPTER_ID = "default-enterprise-tiss";
export const DEFAULT_TISS_PROVIDER_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultTISSProviderAdapterOptions = {
  provider?: Extract<TISSProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: TISSProcessInput): AbortSignal | undefined {
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

function toRequest(input: TISSProcessInput): CanonicalTISSRequest {
  return {
    kind: "canonical-tiss-request",
    mode: input.mode,
    metadata: input.metadata,
    documentId: input.documentId,
    profileReference: input.profileReference,
    providerReference: input.providerReference,
    structuralNotes: input.structuralNotes,
  };
}

/**
 * Adapter oficial TISS-01 — TISS Provider default / enterprise.
 */
export class DefaultTISSProviderAdapter implements TISSProviderPort {
  readonly providerId: Extract<TISSProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: TISSProviderMetadata;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultTISSProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} TISS provider ready (structural infrastructure — no real XML/operator dispatch).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default TISS Provider" : "Enterprise TISS Provider",
      version: DEFAULT_TISS_PROVIDER_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-01 Enterprise TISS Provider — structural only; no XML, no operator, no ANS rules.",
    };
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  capabilities(): TISSProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_TISS_PROVIDER_ADAPTER_ID,
      tiss: { ...DEFAULT_TISS_PROVIDER_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsStructuralProcess: true,
      supportsResolveProfile: true,
      supportsResolveProvider: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsClinicalValidation: false,
    };
  }

  providerInfo(): TISSProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TISS",
      capabilities: { ...DEFAULT_TISS_PROVIDER_CAPABILITIES },
    };
  }

  async health(): Promise<TISSProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy ? "ready" : "unhealthy",
      message: this.healthy ? this.message : "TISS provider unhealthy.",
    };
  }

  async validateConfiguration(): Promise<TISSProviderConfigurationValidation> {
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [
        "TISS-01: infraestrutura estrutural — XML real / dispatch a operadoras / regras ANS não implementados (aguardam TISS-GATE-01 + sprints funcionais).",
      ],
      message: "Enterprise TISS provider ready (structural).",
    };
  }

  async process(input: TISSProcessInput): Promise<TISSProviderOperationResult> {
    const requestId = input.requestId ?? createTISSProviderRequestId();
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
    const logs: TISSProviderStructuredLog[] = [];

    const fail = (message: string, code: string, attempts: number): TISSProviderOperationResult => {
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
        kind: "canonical-tiss-result",
        ok: false,
        requestId,
        request: toRequest(input),
        metadata: input.metadata,
        message,
        code,
        realTissExecuted: false,
        provider: this.providerId,
        simulated: false,
        telemetry: {
          latencyMs: Math.max(0, Date.now() - startedMs),
          attempts,
          cancelled: signal?.aborted === true,
          mode: input.mode,
        },
        logs,
      };
    };

    if (!this.healthy) {
      return fail("TISS provider unhealthy.", "TISS_UNHEALTHY", 0);
    }

    if (!input.mode || !input.metadata?.sessionId) {
      return fail("mode e metadata.sessionId são obrigatórios.", "TISS_INVALID_INPUT", 0);
    }

    if (signal?.aborted) {
      return fail("Operação TISS cancelada antes do início.", "TISS_CANCELLED", 0);
    }

    const maxAttempts = retryCount + 1;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) {
        return fail("Operação TISS cancelada.", "TISS_CANCELLED", attempt);
      }

      try {
        const outcome = await this.withTimeout(
          this.executeProcess(input, requestId, attempt, logs),
          timeoutMs,
          signal,
        );

        logs.push({
          level: "info",
          code: "TISS_OK",
          message: `TISS ${input.mode} completed (structural, realTissExecuted=false)`,
          requestId,
          providerId: this.providerId,
          attempt,
          mode: input.mode,
        });

        return {
          kind: "canonical-tiss-result",
          ok: true,
          requestId,
          request: outcome.request,
          metadata: input.metadata,
          profileReference: outcome.profileReference,
          providerReference: outcome.providerReference,
          message: `Enterprise TISS structural process completed (${input.mode}).`,
          code: "TISS_STRUCTURAL_OK",
          realTissExecuted: false,
          provider: this.providerId,
          simulated: false,
          telemetry: {
            latencyMs: Math.max(0, Date.now() - startedMs),
            attempts: attempt,
            cancelled: false,
            mode: input.mode,
          },
          logs,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (signal?.aborted || /cancel/i.test(lastError)) {
          return fail(lastError, "TISS_CANCELLED", attempt);
        }
        if (/timeout/i.test(lastError)) {
          return fail(lastError, "TISS_TIMEOUT", attempt);
        }
        logs.push({
          level: "warn",
          code: "TISS_RETRY",
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

    return fail(lastError ?? "Operação TISS falhou após retries.", "TISS_FAILED", maxAttempts);
  }

  private async executeProcess(
    input: TISSProcessInput,
    requestId: string,
    attempt: number,
    logs: TISSProviderStructuredLog[],
  ): Promise<{
    request: CanonicalTISSRequest;
    profileReference?: CanonicalTISSProfileReference;
    providerReference?: CanonicalTISSProviderReference;
  }> {
    if (this.failAttemptsRemaining > 0) {
      this.failAttemptsRemaining -= 1;
      throw new Error(`Transient TISS failure (attempt ${attempt}, request ${requestId}).`);
    }

    void this.now();
    logs.push({
      level: "info",
      code: "TISS_START",
      message: `Starting structural TISS mode=${input.mode}.`,
      requestId,
      providerId: this.providerId,
      attempt,
      mode: input.mode,
    });

    const forceDelayMs = readPositiveInt(input.attributes?.forceDelayMs, 0);
    if (forceDelayMs > 0) {
      await this.sleep(forceDelayMs);
    }

    const profileReference: CanonicalTISSProfileReference | undefined =
      input.profileReference ??
      (input.metadata.profileRef
        ? {
            kind: "canonical-tiss-profile-reference",
            profileRef: input.metadata.profileRef,
          }
        : input.mode === "resolve-profile"
          ? {
              kind: "canonical-tiss-profile-reference",
              profileRef: "structural-default-profile",
              namespace: "enterprise.tiss",
              version: "1.0.0",
            }
          : undefined);

    const providerReference: CanonicalTISSProviderReference = input.providerReference ?? {
      kind: "canonical-tiss-provider-reference",
      providerRef: this.providerId,
      adapterId: DEFAULT_TISS_PROVIDER_ADAPTER_ID,
      version: DEFAULT_TISS_PROVIDER_VERSION,
    };

    return {
      request: toRequest(input),
      profileReference,
      providerReference,
    };
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
            reject(new Error(`TISS timeout after ${timeoutMs}ms.`));
          }, timeoutMs);
          if (signal) {
            onAbort = () => reject(new Error("TISS cancelled."));
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

/** Alias oficial do adapter enterprise (TISS-01). */
export const EnterpriseTISSProviderAdapter = DefaultTISSProviderAdapter;
