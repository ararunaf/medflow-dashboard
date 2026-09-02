/**
 * DefaultOperatorRuntimeAdapter — C-04 / ECS-01.
 *
 * Adapter oficial do Enterprise Operator Runtime.
 * Responde estruturalmente (prepareProfile/getProfile/listProfiles/stats)
 * sem depender de Ports Enterprise.
 *
 * Sem operadoras reais. Sem lógica condicional por operadora.
 * Sem autenticação. Sem SOAP/XML/REST funcional. Sem banco.
 *
 * OPERATOR CAPABILITY MODEL (Regra Permanente nº 7).
 */
import {
  DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
  toOperatorCapabilities,
} from "../ports/capabilities";
import {
  OPERATOR_RUNTIME_IDENTITY,
  createOperatorContextId,
  createOperatorProfileId,
  createOperatorRequestId,
  createOperatorResponseId,
  createOperatorRuntimeRequestId,
} from "../ports/identity";
import type { OperatorRuntimePort } from "../ports/operator-runtime-port";
import type {
  OperatorCapabilityProfile,
  OperatorContext,
  OperatorRequest,
  OperatorResponse,
} from "../ports/canonical";
import { createEmptyOperatorCapabilityProfile } from "../ports/canonical";
import type {
  GetOperatorProfileInput,
  GetOperatorProfileResult,
  ListOperatorProfilesInput,
  ListOperatorProfilesResult,
  OperatorRuntimeCapabilities,
  OperatorRuntimeEnterpriseDeps,
  OperatorRuntimeHealth,
  OperatorRuntimeInfo,
  OperatorRuntimeOperationalControls,
  OperatorRuntimeOperationEnvelope,
  OperatorRuntimeProviderId,
  OperatorRuntimeProviderMetadata,
  OperatorRuntimeStructuredLog,
  OperatorStatsInput,
  OperatorStatsResult,
  PrepareOperatorProfileInput,
  PrepareOperatorProfileResult,
} from "../ports/types";
import { InMemoryOperatorRuntimeStore, type OperatorRuntimeStore } from "../store";

export const DEFAULT_OPERATOR_RUNTIME_ADAPTER_ID = "default-enterprise-operator-runtime";
export const DEFAULT_OPERATOR_RUNTIME_VERSION = OPERATOR_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultOperatorRuntimeAdapterOptions = {
  provider?: Extract<OperatorRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: OperatorRuntimeStore;
  enterpriseDeps?: OperatorRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  failAttempts?: number;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(input: OperatorRuntimeOperationalControls): AbortSignal | undefined {
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

function portShapeOk(port: unknown): boolean {
  return (
    !!port &&
    typeof (port as { health?: unknown }).health === "function" &&
    typeof (port as { capabilities?: unknown }).capabilities === "function"
  );
}

function structuralFlags() {
  return {
    operatorImplemented: false,
    operatorCapabilityProfileImplemented: false,
    operatorAuthenticationImplemented: false,
    operatorCommunicationImplemented: false,
    soapFunctionalImplemented: false,
    xmlFunctionalImplemented: false,
    restImplemented: false,
    authorizationImplemented: false,
  } as const;
}

function resolveContext(input: PrepareOperatorProfileInput): OperatorContext {
  return (
    input.operatorContext ?? {
      kind: "canonical-operator-context" as const,
      contextId: createOperatorContextId(),
      capabilityProfile: input.capabilityProfile,
      xmlDocument: input.xmlDocument,
      canonicalGuide: input.canonicalGuide,
      qualityAssessment: input.qualityAssessment,
      validationResult: input.validationResult,
      auditResult: input.auditResult,
      structuralNotes: input.request?.structuralNotes,
      executionStatus: "prepared",
      warnings: [],
      errors: [],
    }
  );
}

function resolveProfile(input: PrepareOperatorProfileInput): OperatorCapabilityProfile {
  const base =
    input.capabilityProfile ??
    input.operatorContext?.capabilityProfile ??
    input.request?.capabilityProfile;
  return createEmptyOperatorCapabilityProfile({
    ...base,
    profileId: base?.profileId ?? createOperatorProfileId(),
  });
}

function resolveRequest(input: PrepareOperatorProfileInput): OperatorRequest {
  const base = input.request ?? {
    kind: "canonical-operator-request" as const,
    ...structuralFlags(),
  };
  const operatorContext = resolveContext(input);
  const capabilityProfile = resolveProfile(input);
  return {
    ...base,
    kind: "canonical-operator-request",
    requestId: base.requestId ?? input.requestId ?? createOperatorRequestId(),
    name: base.name ?? input.name,
    operation: base.operation ?? input.operation ?? "prepareProfile",
    operatorContext: { ...operatorContext, capabilityProfile },
    capabilityProfile,
    xmlDocument: base.xmlDocument ?? input.xmlDocument,
    canonicalGuide: base.canonicalGuide ?? input.canonicalGuide,
    qualityAssessment: base.qualityAssessment ?? input.qualityAssessment,
    validationResult: base.validationResult ?? input.validationResult,
    auditResult: base.auditResult ?? input.auditResult,
    ...structuralFlags(),
  };
}

/**
 * Adapter oficial C-04 — Operator Runtime default / enterprise.
 * Nunca ramifica por operatorId/displayName (Regra Permanente nº 7).
 */
export class DefaultOperatorRuntimeAdapter implements OperatorRuntimePort {
  readonly providerId: Extract<OperatorRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: OperatorRuntimeProviderMetadata;
  private readonly store: OperatorRuntimeStore;
  private readonly enterpriseDeps: OperatorRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultOperatorRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Operator Runtime ready (structural only — no real operators).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default Operator Runtime" : OPERATOR_RUNTIME_IDENTITY.name,
      version: DEFAULT_OPERATOR_RUNTIME_VERSION,
      vendor: OPERATOR_RUNTIME_IDENTITY.vendor,
      layer: OPERATOR_RUNTIME_IDENTITY.layer,
      vendorAgnostic: OPERATOR_RUNTIME_IDENTITY.vendorAgnostic,
      description: OPERATOR_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryOperatorRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  getStore(): OperatorRuntimeStore {
    return this.store;
  }

  capabilities(): OperatorRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_OPERATOR_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareProfile: true,
      supportsGetProfile: true,
      supportsListProfiles: true,
      supportsStats: true,
      supportsCanonicalOperator: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toOperatorCapabilities(DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): OperatorRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "OPERATOR_RUNTIME",
      capabilities: { ...DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<OperatorRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    let soapRuntimeOk = true;
    let xmlRuntimeOk = true;
    let xmlValidationRuntimeOk = true;
    let qualityRuntimeOk = true;
    let autoFillRuntimeOk = true;
    let tissMappingRuntimeOk = true;
    let auditRuntimeOk = true;
    let validationRuntimeOk = true;

    if (typeof this.enterpriseDeps.getSOAPRuntimePort === "function") {
      soapRuntimeOk = portShapeOk(this.enterpriseDeps.getSOAPRuntimePort());
    }
    if (typeof this.enterpriseDeps.getXMLRuntimePort === "function") {
      xmlRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLRuntimePort());
    }
    if (typeof this.enterpriseDeps.getQualityRuntimePort === "function") {
      qualityRuntimeOk = portShapeOk(this.enterpriseDeps.getQualityRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAutoFillRuntimePort === "function") {
      autoFillRuntimeOk = portShapeOk(this.enterpriseDeps.getAutoFillRuntimePort());
    }
    if (typeof this.enterpriseDeps.getTISSMappingRuntimePort === "function") {
      tissMappingRuntimeOk = portShapeOk(this.enterpriseDeps.getTISSMappingRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuditRuntimePort === "function") {
      auditRuntimeOk = portShapeOk(this.enterpriseDeps.getAuditRuntimePort());
    }
    if (typeof this.enterpriseDeps.getValidationRuntimePort === "function") {
      validationRuntimeOk = portShapeOk(this.enterpriseDeps.getValidationRuntimePort());
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      soapRuntimeOk &&
      xmlRuntimeOk &&
      xmlValidationRuntimeOk &&
      qualityRuntimeOk &&
      autoFillRuntimeOk &&
      tissMappingRuntimeOk &&
      auditRuntimeOk &&
      validationRuntimeOk;

    return {
      kind: "canonical-operator-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      soapRuntimeOk,
      xmlRuntimeOk,
      xmlValidationRuntimeOk,
      qualityRuntimeOk,
      autoFillRuntimeOk,
      tissMappingRuntimeOk,
      auditRuntimeOk,
      validationRuntimeOk,
      storedProfileCount: this.store.profileCount(),
      storedResponseCount: this.store.responseCount(),
      storedRequestCount: this.store.requestCount(),
      storedContextCount: this.store.contextCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Operator Runtime pronto (estrutural C-04 — sem operadoras reais)."
          : "Operator Runtime degradado — ver Ports Enterprise."
        : "Operator Runtime unhealthy.",
    };
  }

  async prepareProfile(input: PrepareOperatorProfileInput): Promise<PrepareOperatorProfileResult> {
    return this.runOperation("prepareProfile", input, async () => {
      const request = resolveRequest(input);
      const stamp = nowIso(this.now);
      const responseId = createOperatorResponseId();
      const profile = request.capabilityProfile!;
      this.store.setRequest(request);
      this.store.setProfile(profile);

      const operatorContext: OperatorContext = {
        ...request.operatorContext!,
        requestId: request.requestId,
        responseId,
        profileId: profile.profileId,
        capabilityProfile: profile,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: "prepared",
        executionDuration: 0,
        processedItems: 0,
        warnings: request.operatorContext?.warnings ?? [],
        errors: request.operatorContext?.errors ?? [],
      };

      const response: OperatorResponse = {
        kind: "canonical-operator-response",
        ok: true,
        responseId,
        request,
        profile,
        operatorContext,
        xmlDocument: request.xmlDocument,
        canonicalGuide: request.canonicalGuide,
        qualityAssessment: request.qualityAssessment,
        validationResult: request.validationResult,
        auditResult: request.auditResult,
        realOperatorResolved: false,
        communicationExecuted: false,
        runtimeReady: true,
        ...structuralFlags(),
        status: "prepared",
        message:
          "Canonical Operator structural profile (C-04 foundation — no real operator / auth / SOAP / XML / REST).",
        code: "OPERATOR_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResponse(response);
      this.store.setContext(operatorContext);

      return {
        ok: true,
        response,
        code: "OPERATOR_RUNTIME_OK",
        message: response.message,
      };
    });
  }

  async getProfile(input: GetOperatorProfileInput): Promise<GetOperatorProfileResult> {
    return this.runOperation("getProfile", input, async () => {
      if (input.responseId) {
        const response = this.store.getResponse(input.responseId);
        if (!response) {
          return {
            ok: false,
            code: "OPERATOR_RUNTIME_NOT_FOUND",
            message: "Canonical Operator response not found.",
          };
        }
        return {
          ok: true,
          response,
          profile: response.profile,
          code: "OPERATOR_RUNTIME_OK",
          message: "Canonical Operator response loaded.",
        };
      }
      if (input.profileId) {
        const profile = this.store.getProfile(input.profileId);
        if (!profile) {
          return {
            ok: false,
            code: "OPERATOR_RUNTIME_NOT_FOUND",
            message: "Canonical Operator capability profile not found.",
          };
        }
        return {
          ok: true,
          profile,
          code: "OPERATOR_RUNTIME_OK",
          message: "Canonical Operator capability profile loaded.",
        };
      }
      return {
        ok: false,
        code: "OPERATOR_RUNTIME_INVALID_INPUT",
        message: "responseId or profileId is required.",
      };
    });
  }

  async listProfiles(input: ListOperatorProfilesInput = {}): Promise<ListOperatorProfilesResult> {
    return this.runOperation("listProfiles", input, async () => {
      let responses = this.store.listResponses();
      if (input.status != null) {
        responses = responses.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        responses,
        profiles: this.store.listProfiles(),
        statistics: this.store.statistics(),
        code: "OPERATOR_RUNTIME_OK",
        message: `Listed ${responses.length} canonical Operator responses / ${this.store.profileCount()} profiles.`,
      };
    });
  }

  async stats(input: OperatorStatsInput = {}): Promise<OperatorStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const response: OperatorResponse = {
        kind: "canonical-operator-response",
        ok: true,
        responseId: createOperatorResponseId(),
        request: {
          kind: "canonical-operator-request",
          operation: "stats",
          ...structuralFlags(),
        },
        realOperatorResolved: false,
        communicationExecuted: false,
        runtimeReady: true,
        ...structuralFlags(),
        status: "pending",
        message: "Canonical Operator Runtime structural statistics.",
        code: "OPERATOR_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      return {
        ok: true,
        statistics,
        response,
        code: "OPERATOR_RUNTIME_OK",
        message: `Operator Runtime stats: ${statistics.totalProfiles} profiles.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: OperatorRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & OperatorRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createOperatorRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: OperatorRuntimeStructuredLog[] = [];
    let attempts = 0;
    let lastError: unknown;

    try {
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        attempts = attempt + 1;
        if (signal?.aborted) {
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          return {
            ok: false,
            requestId,
            provider: this.providerId,
            code: "OPERATOR_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & OperatorRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "OPERATOR_RUNTIME_RETRY",
            message: "Transient structural failure — retrying.",
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          if (attempt < retryCount) {
            await this.sleep(this.defaultRetryBackoffMs * attempts);
            continue;
          }
          break;
        }

        const outcome = await Promise.race([
          fn(),
          new Promise<never>((_, reject) => {
            const timer = setTimeout(() => {
              reject(new Error("Operator Runtime operation timed out."));
            }, timeoutMs);
            if (typeof timer === "object" && "unref" in timer) {
              (timer as { unref?: () => void }).unref?.();
            }
          }),
        ]);

        const end = typeof performance !== "undefined" ? performance.now() : Date.now();
        return {
          ...outcome,
          requestId,
          provider: this.providerId,
          telemetry: {
            latencyMs: Math.max(0, Math.round(end - started)),
            attempts,
            cancelled: false,
            operation,
          },
          logs,
        };
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "OPERATOR_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Operator Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & OperatorRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Operator Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "OPERATOR_RUNTIME_CANCELLED"
          : isTimeout
            ? "OPERATOR_RUNTIME_TIMEOUT"
            : "OPERATOR_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & OperatorRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-04). */
export const EnterpriseOperatorRuntimeAdapter = DefaultOperatorRuntimeAdapter;
