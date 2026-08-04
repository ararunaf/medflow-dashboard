/**
 * DefaultAuthorizationRuntimeAdapter — C-05 / ECS-01.
 *
 * Adapter oficial do Enterprise Authorization Runtime.
 * Responde estruturalmente (prepareAuthorization/getAuthorization/
 * listAuthorizations/stats) sem depender de Ports Enterprise.
 *
 * Sem autorização funcional. Sem elegibilidade. Sem integração com operadoras.
 * Sem SOAP/XML/REST funcional. Sem autenticação. Sem banco.
 *
 * AUTHORIZATION STRATEGY PATTERN (Regra Permanente nº 9).
 * POLICY-DRIVEN AUTHORIZATION — sem if/switch por operadora/versão/guia.
 */
import {
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  toAuthorizationCapabilities,
} from "../ports/capabilities";
import {
  AUTHORIZATION_RUNTIME_IDENTITY,
  createAuthorizationContextId,
  createAuthorizationPolicyId,
  createAuthorizationRequestId,
  createAuthorizationResponseId,
  createAuthorizationRuntimeRequestId,
  createAuthorizationStrategyId,
} from "../ports/identity";
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type {
  AuthorizationContext,
  AuthorizationPolicy,
  AuthorizationRequest,
  AuthorizationResponse,
  AuthorizationStrategy,
} from "../ports/canonical";
import {
  createEmptyAuthorizationPolicy,
  createEmptyAuthorizationStrategy,
} from "../ports/canonical";
import type {
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeEnterpriseDeps,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeOperationalControls,
  AuthorizationRuntimeOperationEnvelope,
  AuthorizationRuntimeProviderId,
  AuthorizationRuntimeProviderMetadata,
  AuthorizationRuntimeStructuredLog,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  GetAuthorizationInput,
  GetAuthorizationResult,
  ListAuthorizationsInput,
  ListAuthorizationsResult,
  PrepareAuthorizationInput,
  PrepareAuthorizationResult,
} from "../ports/types";
import { InMemoryAuthorizationRuntimeStore, type AuthorizationRuntimeStore } from "../store";

export const DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID = "default-enterprise-authorization-runtime";
export const DEFAULT_AUTHORIZATION_RUNTIME_VERSION = AUTHORIZATION_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultAuthorizationRuntimeAdapterOptions = {
  provider?: Extract<AuthorizationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: AuthorizationRuntimeStore;
  enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;
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

function readSignal(input: AuthorizationRuntimeOperationalControls): AbortSignal | undefined {
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
    authorizationImplemented: false,
    eligibilityImplemented: false,
    attachmentAuthorizationImplemented: false,
    batchAuthorizationImplemented: false,
    statusPollingImplemented: false,
    preAuthorizationImplemented: false,
    soapFunctionalImplemented: false,
    xmlFunctionalImplemented: false,
    restImplemented: false,
    operatorCommunicationImplemented: false,
  } as const;
}

function resolveStrategy(input: PrepareAuthorizationInput): AuthorizationStrategy {
  const base =
    input.strategy ??
    input.policy?.strategy ??
    input.authorizationContext?.strategy ??
    input.request?.strategy;
  return createEmptyAuthorizationStrategy({
    ...base,
    strategyId: base?.strategyId ?? createAuthorizationStrategyId(),
    strategyKind: base?.strategyKind ?? input.policy?.preferredStrategyKind ?? "synchronous",
  });
}

function resolvePolicy(
  input: PrepareAuthorizationInput,
  strategy: AuthorizationStrategy,
): AuthorizationPolicy {
  const base = input.policy ?? input.authorizationContext?.policy ?? input.request?.policy;
  return createEmptyAuthorizationPolicy({
    ...base,
    policyId: base?.policyId ?? createAuthorizationPolicyId(),
    preferredStrategyKind: base?.preferredStrategyKind ?? strategy.strategyKind,
    capabilityProfile:
      base?.capabilityProfile ??
      input.capabilityProfile ??
      input.authorizationContext?.capabilityProfile ??
      input.request?.capabilityProfile,
    strategy,
  });
}

function resolveContext(
  input: PrepareAuthorizationInput,
  strategy: AuthorizationStrategy,
  policy: AuthorizationPolicy,
): AuthorizationContext {
  return (
    input.authorizationContext ?? {
      kind: "canonical-authorization-context" as const,
      contextId: createAuthorizationContextId(),
      strategyId: strategy.strategyId,
      policyId: policy.policyId,
      strategy,
      policy,
      capabilityProfile: policy.capabilityProfile ?? input.capabilityProfile,
      xmlDocument: input.xmlDocument,
      xmlValidationResult: input.xmlValidationResult,
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

function resolveRequest(
  input: PrepareAuthorizationInput,
  strategy: AuthorizationStrategy,
  policy: AuthorizationPolicy,
): AuthorizationRequest {
  const base = input.request ?? {
    kind: "canonical-authorization-request" as const,
    ...structuralFlags(),
  };
  const authorizationContext = {
    ...resolveContext(input, strategy, policy),
    strategy,
    policy,
    capabilityProfile: policy.capabilityProfile,
  };
  return {
    ...base,
    kind: "canonical-authorization-request",
    requestId: base.requestId ?? input.requestId ?? createAuthorizationRequestId(),
    name: base.name ?? input.name,
    operation: base.operation ?? input.operation ?? "prepareAuthorization",
    authorizationContext,
    strategy,
    policy,
    capabilityProfile: policy.capabilityProfile ?? input.capabilityProfile,
    xmlDocument: base.xmlDocument ?? input.xmlDocument,
    xmlValidationResult: base.xmlValidationResult ?? input.xmlValidationResult,
    canonicalGuide: base.canonicalGuide ?? input.canonicalGuide,
    qualityAssessment: base.qualityAssessment ?? input.qualityAssessment,
    validationResult: base.validationResult ?? input.validationResult,
    auditResult: base.auditResult ?? input.auditResult,
    ...structuralFlags(),
  };
}

/**
 * Adapter oficial C-05 — Authorization Runtime default / enterprise.
 * Nunca ramifica por operadora/versão/guia (POLICY-DRIVEN AUTHORIZATION).
 * Nunca implementa autorização inline (Regra Permanente nº 9).
 */
export class DefaultAuthorizationRuntimeAdapter implements AuthorizationRuntimePort {
  readonly providerId: Extract<AuthorizationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: AuthorizationRuntimeProviderMetadata;
  private readonly store: AuthorizationRuntimeStore;
  private readonly enterpriseDeps: AuthorizationRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultAuthorizationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Authorization Runtime ready (structural only — no functional authorization).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Authorization Runtime"
          : AUTHORIZATION_RUNTIME_IDENTITY.name,
      version: DEFAULT_AUTHORIZATION_RUNTIME_VERSION,
      vendor: AUTHORIZATION_RUNTIME_IDENTITY.vendor,
      layer: AUTHORIZATION_RUNTIME_IDENTITY.layer,
      vendorAgnostic: AUTHORIZATION_RUNTIME_IDENTITY.vendorAgnostic,
      description: AUTHORIZATION_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryAuthorizationRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  getStore(): AuthorizationRuntimeStore {
    return this.store;
  }

  capabilities(): AuthorizationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareAuthorization: true,
      supportsGetAuthorization: true,
      supportsListAuthorizations: true,
      supportsStats: true,
      supportsCanonicalAuthorization: true,
      supportsStrategySelection: true,
      supportsPolicyDrivenAuthorization: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesOperatorRuntimePort: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toAuthorizationCapabilities(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): AuthorizationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUTHORIZATION_RUNTIME",
      capabilities: { ...DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AuthorizationRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    let operatorRuntimeOk = true;
    let soapRuntimeOk = true;
    let xmlRuntimeOk = true;
    let xmlValidationRuntimeOk = true;
    let qualityRuntimeOk = true;
    let autoFillRuntimeOk = true;
    let auditRuntimeOk = true;
    let validationRuntimeOk = true;

    if (typeof this.enterpriseDeps.getOperatorRuntimePort === "function") {
      operatorRuntimeOk = portShapeOk(this.enterpriseDeps.getOperatorRuntimePort());
    }
    if (typeof this.enterpriseDeps.getSOAPRuntimePort === "function") {
      soapRuntimeOk = portShapeOk(this.enterpriseDeps.getSOAPRuntimePort());
    }
    if (typeof this.enterpriseDeps.getXMLRuntimePort === "function") {
      xmlRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLRuntimePort());
    }
    if (typeof this.enterpriseDeps.getXMLValidationRuntimePort === "function") {
      xmlValidationRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLValidationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getQualityRuntimePort === "function") {
      qualityRuntimeOk = portShapeOk(this.enterpriseDeps.getQualityRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAutoFillRuntimePort === "function") {
      autoFillRuntimeOk = portShapeOk(this.enterpriseDeps.getAutoFillRuntimePort());
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
      operatorRuntimeOk &&
      soapRuntimeOk &&
      xmlRuntimeOk &&
      xmlValidationRuntimeOk &&
      qualityRuntimeOk &&
      autoFillRuntimeOk &&
      auditRuntimeOk &&
      validationRuntimeOk;

    return {
      kind: "canonical-authorization-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      operatorRuntimeOk,
      soapRuntimeOk,
      xmlRuntimeOk,
      xmlValidationRuntimeOk,
      qualityRuntimeOk,
      autoFillRuntimeOk,
      auditRuntimeOk,
      validationRuntimeOk,
      storedStrategyCount: this.store.strategyCount(),
      storedPolicyCount: this.store.policyCount(),
      storedResponseCount: this.store.responseCount(),
      storedRequestCount: this.store.requestCount(),
      storedContextCount: this.store.contextCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Authorization Runtime pronto (estrutural C-05 — sem autorização funcional)."
          : "Authorization Runtime degradado — ver Ports Enterprise."
        : "Authorization Runtime unhealthy.",
    };
  }

  async prepareAuthorization(
    input: PrepareAuthorizationInput,
  ): Promise<PrepareAuthorizationResult> {
    return this.runOperation("prepareAuthorization", input, async () => {
      const strategy = resolveStrategy(input);
      const policy = resolvePolicy(input, strategy);
      const request = resolveRequest(input, strategy, policy);
      const stamp = nowIso(this.now);
      const responseId = createAuthorizationResponseId();
      this.store.setRequest(request);
      this.store.setStrategy(strategy);
      this.store.setPolicy(policy);

      const authorizationContext: AuthorizationContext = {
        ...request.authorizationContext!,
        requestId: request.requestId,
        responseId,
        strategyId: strategy.strategyId,
        policyId: policy.policyId,
        strategy,
        policy,
        capabilityProfile: policy.capabilityProfile,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: "prepared",
        executionDuration: 0,
        processedItems: 0,
        warnings: request.authorizationContext?.warnings ?? [],
        errors: request.authorizationContext?.errors ?? [],
      };

      const response: AuthorizationResponse = {
        kind: "canonical-authorization-response",
        ok: true,
        responseId,
        request,
        strategy,
        policy,
        authorizationContext,
        capabilityProfile: policy.capabilityProfile,
        xmlDocument: request.xmlDocument,
        xmlValidationResult: request.xmlValidationResult,
        canonicalGuide: request.canonicalGuide,
        qualityAssessment: request.qualityAssessment,
        validationResult: request.validationResult,
        auditResult: request.auditResult,
        authorizationExecuted: false,
        eligibilityExecuted: false,
        communicationExecuted: false,
        runtimeReady: true,
        ...structuralFlags(),
        status: "prepared",
        message:
          "Canonical Authorization structural envelope (C-05 foundation — no functional authorization / eligibility / SOAP / XML / operator integration).",
        code: "AUTHORIZATION_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResponse(response);
      this.store.setContext(authorizationContext);

      return {
        ok: true,
        response,
        code: "AUTHORIZATION_RUNTIME_OK",
        message: response.message,
      };
    });
  }

  async getAuthorization(input: GetAuthorizationInput): Promise<GetAuthorizationResult> {
    return this.runOperation("getAuthorization", input, async () => {
      if (input.responseId) {
        const response = this.store.getResponse(input.responseId);
        if (!response) {
          return {
            ok: false,
            code: "AUTHORIZATION_RUNTIME_NOT_FOUND",
            message: "Canonical Authorization response not found.",
          };
        }
        return {
          ok: true,
          response,
          strategy: response.strategy,
          policy: response.policy,
          code: "AUTHORIZATION_RUNTIME_OK",
          message: "Canonical Authorization response loaded.",
        };
      }
      if (input.strategyId) {
        const strategy = this.store.getStrategy(input.strategyId);
        if (!strategy) {
          return {
            ok: false,
            code: "AUTHORIZATION_RUNTIME_NOT_FOUND",
            message: "Canonical Authorization strategy not found.",
          };
        }
        return {
          ok: true,
          strategy,
          code: "AUTHORIZATION_RUNTIME_OK",
          message: "Canonical Authorization strategy loaded.",
        };
      }
      if (input.policyId) {
        const policy = this.store.getPolicy(input.policyId);
        if (!policy) {
          return {
            ok: false,
            code: "AUTHORIZATION_RUNTIME_NOT_FOUND",
            message: "Canonical Authorization policy not found.",
          };
        }
        return {
          ok: true,
          policy,
          code: "AUTHORIZATION_RUNTIME_OK",
          message: "Canonical Authorization policy loaded.",
        };
      }
      return {
        ok: false,
        code: "AUTHORIZATION_RUNTIME_INVALID_INPUT",
        message: "responseId, strategyId or policyId is required.",
      };
    });
  }

  async listAuthorizations(input: ListAuthorizationsInput = {}): Promise<ListAuthorizationsResult> {
    return this.runOperation("listAuthorizations", input, async () => {
      let responses = this.store.listResponses();
      if (input.status != null) {
        responses = responses.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        responses,
        strategies: this.store.listStrategies(),
        policies: this.store.listPolicies(),
        statistics: this.store.statistics(),
        code: "AUTHORIZATION_RUNTIME_OK",
        message: `Listed ${responses.length} canonical Authorization responses / ${this.store.strategyCount()} strategies / ${this.store.policyCount()} policies.`,
      };
    });
  }

  async stats(input: AuthorizationStatsInput = {}): Promise<AuthorizationStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const response: AuthorizationResponse = {
        kind: "canonical-authorization-response",
        ok: true,
        responseId: createAuthorizationResponseId(),
        request: {
          kind: "canonical-authorization-request",
          operation: "stats",
          ...structuralFlags(),
        },
        authorizationExecuted: false,
        eligibilityExecuted: false,
        communicationExecuted: false,
        runtimeReady: true,
        ...structuralFlags(),
        status: "pending",
        message: "Canonical Authorization Runtime structural statistics.",
        code: "AUTHORIZATION_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      return {
        ok: true,
        statistics,
        response,
        code: "AUTHORIZATION_RUNTIME_OK",
        message: `Authorization Runtime stats: ${statistics.totalStrategies} strategies / ${statistics.totalPolicies} policies.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: AuthorizationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & AuthorizationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createAuthorizationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: AuthorizationRuntimeStructuredLog[] = [];
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
            code: "AUTHORIZATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & AuthorizationRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "AUTHORIZATION_RUNTIME_RETRY",
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
              reject(new Error("Authorization Runtime operation timed out."));
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
        code: "AUTHORIZATION_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error
            ? lastError.message
            : "Authorization Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AuthorizationRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Authorization Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "AUTHORIZATION_RUNTIME_CANCELLED"
          : isTimeout
            ? "AUTHORIZATION_RUNTIME_TIMEOUT"
            : "AUTHORIZATION_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & AuthorizationRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-05). */
export const EnterpriseAuthorizationRuntimeAdapter = DefaultAuthorizationRuntimeAdapter;
