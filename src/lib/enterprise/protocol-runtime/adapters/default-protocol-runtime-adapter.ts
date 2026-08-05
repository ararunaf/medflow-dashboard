/**
 * DefaultProtocolRuntimeAdapter — C-07 / ECS-01.
 *
 * Adapter oficial do Enterprise Protocol Runtime.
 * Responde estruturalmente (prepareProfile/getProfile/listProfiles/
 * resolveProtocol/stats) sem depender de Ports Enterprise.
 *
 * Sem SOAP. Sem REST. Sem gRPC. Sem mensageria. Sem HTTP. Sem TLS.
 * Sem autenticação. Sem banco. Sem resolução funcional.
 *
 * PROTOCOL ABSTRACTION (Regra Permanente nº 12):
 * NUNCA conhece protocolos concretos. NUNCA usa if/switch em SOAP/REST/gRPC/
 * mensageria. Resolução futura via ProtocolResolver (contratos apenas).
 */
import {
  DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
  toProtocolCapabilities,
} from "../ports/capabilities";
import {
  PROTOCOL_RUNTIME_IDENTITY,
  createProtocolContextId,
  createProtocolProfileId,
  createProtocolResolverId,
  createProtocolRuntimeRequestId,
} from "../ports/identity";
import type { ProtocolRuntimePort } from "../ports/protocol-runtime-port";
import type { ProtocolContext, ProtocolProfile } from "../ports/canonical";
import {
  createEmptyProtocolCapabilities,
  createEmptyProtocolProfile,
  createEmptyProtocolResolver,
} from "../ports/canonical";
import type {
  GetProtocolProfileInput,
  GetProtocolProfileResult,
  ListProtocolProfilesInput,
  ListProtocolProfilesResult,
  PrepareProtocolProfileInput,
  PrepareProtocolProfileResult,
  ProtocolRuntimeCapabilities,
  ProtocolRuntimeEnterpriseDeps,
  ProtocolRuntimeHealth,
  ProtocolRuntimeInfo,
  ProtocolRuntimeOperationalControls,
  ProtocolRuntimeOperationEnvelope,
  ProtocolRuntimeProviderId,
  ProtocolRuntimeProviderMetadata,
  ProtocolRuntimeStructuredLog,
  ProtocolStatsInput,
  ProtocolStatsResult,
  ResolveProtocolInput,
  ResolveProtocolResult,
} from "../ports/types";
import { InMemoryProtocolRuntimeStore, type ProtocolRuntimeStore } from "../store";

export const DEFAULT_PROTOCOL_RUNTIME_ADAPTER_ID = "default-enterprise-protocol-runtime";
export const DEFAULT_PROTOCOL_RUNTIME_VERSION = PROTOCOL_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultProtocolRuntimeAdapterOptions = {
  provider?: Extract<ProtocolRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: ProtocolRuntimeStore;
  enterpriseDeps?: ProtocolRuntimeEnterpriseDeps;
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

function readSignal(input: ProtocolRuntimeOperationalControls): AbortSignal | undefined {
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
    soapImplemented: false,
    restImplemented: false,
    grpcImplemented: false,
    messagingImplemented: false,
    protocolResolutionImplemented: false,
  } as const;
}

function resolveProfile(input: PrepareProtocolProfileInput, stamp: string): ProtocolProfile {
  return createEmptyProtocolProfile({
    ...input.profile,
    profileId: input.profile?.profileId ?? createProtocolProfileId(),
    profileName: input.profileName ?? input.profile?.profileName,
    abstractProtocolRef: input.abstractProtocolRef ?? input.profile?.abstractProtocolRef,
    state: input.state ?? input.profile?.state ?? "DECLARED",
    requiredCapabilities:
      input.requiredCapabilities ??
      input.profile?.requiredCapabilities ??
      createEmptyProtocolCapabilities(),
    operatorCapabilityProfile:
      input.operatorCapabilityProfile ?? input.profile?.operatorCapabilityProfile,
    metadata: input.metadata ?? input.profile?.metadata,
    tags: input.tags ?? input.profile?.tags ?? [],
    owner: input.owner ?? input.profile?.owner,
    creationTimestamp: input.profile?.creationTimestamp ?? stamp,
    ...structuralFlags(),
  });
}

/**
 * Adapter oficial C-07 — Protocol Runtime default / enterprise.
 * Nunca seleciona protocolo. Nunca envia. Nunca resolve funcionalmente.
 * Nunca conhece SOAP/REST/gRPC/mensageria (Regra Permanente nº 12).
 */
export class DefaultProtocolRuntimeAdapter implements ProtocolRuntimePort {
  readonly providerId: Extract<ProtocolRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: ProtocolRuntimeProviderMetadata;
  private readonly store: ProtocolRuntimeStore;
  private readonly enterpriseDeps: ProtocolRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultProtocolRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Protocol Runtime ready (structural only — no concrete protocols).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default Protocol Runtime" : PROTOCOL_RUNTIME_IDENTITY.name,
      version: DEFAULT_PROTOCOL_RUNTIME_VERSION,
      vendor: PROTOCOL_RUNTIME_IDENTITY.vendor,
      layer: PROTOCOL_RUNTIME_IDENTITY.layer,
      vendorAgnostic: PROTOCOL_RUNTIME_IDENTITY.vendorAgnostic,
      description: PROTOCOL_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryProtocolRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  getStore(): ProtocolRuntimeStore {
    return this.store;
  }

  capabilities(): ProtocolRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_PROTOCOL_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareProfile: true,
      supportsGetProfile: true,
      supportsListProfiles: true,
      supportsResolveProtocol: true,
      supportsStats: true,
      supportsCanonicalProtocolProfile: true,
      supportsProtocolResolver: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesBatchRuntimePort: true,
      usesAuthorizationRuntimePort: true,
      usesOperatorRuntimePort: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      httpImplemented: false,
      tlsImplemented: false,
      authenticationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toProtocolCapabilities(DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): ProtocolRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "PROTOCOL_RUNTIME",
      capabilities: { ...DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ProtocolRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    let batchRuntimeOk = true;
    let authorizationRuntimeOk = true;
    let operatorRuntimeOk = true;
    let soapRuntimeOk = true;
    let xmlRuntimeOk = true;
    let xmlValidationRuntimeOk = true;

    if (typeof this.enterpriseDeps.getBatchRuntimePort === "function") {
      batchRuntimeOk = portShapeOk(this.enterpriseDeps.getBatchRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuthorizationRuntimePort === "function") {
      authorizationRuntimeOk = portShapeOk(this.enterpriseDeps.getAuthorizationRuntimePort());
    }
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

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      batchRuntimeOk &&
      authorizationRuntimeOk &&
      operatorRuntimeOk &&
      soapRuntimeOk &&
      xmlRuntimeOk &&
      xmlValidationRuntimeOk;

    return {
      kind: "canonical-protocol-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      batchRuntimeOk,
      authorizationRuntimeOk,
      operatorRuntimeOk,
      soapRuntimeOk,
      xmlRuntimeOk,
      xmlValidationRuntimeOk,
      storedProfileCount: this.store.profileCount(),
      storedContextCount: this.store.contextCount(),
      storedResolverCount: this.store.resolverCount(),
      runtimeReady: true,
      ...structuralFlags(),
      httpImplemented: false,
      tlsImplemented: false,
      authenticationImplemented: false,
      message: this.healthy
        ? ok
          ? "Protocol Runtime pronto (estrutural C-07 — sem protocolos concretos)."
          : "Protocol Runtime degradado — ver Ports Enterprise."
        : "Protocol Runtime unhealthy.",
    };
  }

  async prepareProfile(input: PrepareProtocolProfileInput): Promise<PrepareProtocolProfileResult> {
    return this.runOperation("prepareProfile", input, async () => {
      const stamp = nowIso(this.now);
      const profile = resolveProfile(input, stamp);
      this.store.setProfile(profile);

      const protocolContext: ProtocolContext = {
        ...(input.protocolContext ?? {
          kind: "canonical-protocol-context" as const,
          contextId: createProtocolContextId(),
        }),
        kind: "canonical-protocol-context",
        contextId: input.protocolContext?.contextId ?? createProtocolContextId(),
        profileId: profile.profileId,
        profile,
        state: profile.state,
        operatorCapabilityProfile: profile.operatorCapabilityProfile,
        authorizationStrategy: input.authorizationStrategy,
        authorizationPolicy: input.authorizationPolicy,
        batchManifest: input.batchManifest,
        xmlDocument: input.xmlDocument,
        xmlValidationResult: input.xmlValidationResult,
        metadata: profile.metadata,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: profile.state ?? "DECLARED",
        executionDuration: 0,
        processedItems: 0,
        warnings: input.protocolContext?.warnings ?? [],
        errors: input.protocolContext?.errors ?? [],
        structuralNotes: input.protocolContext?.structuralNotes ?? profile.structuralNotes,
      };
      this.store.setContext(protocolContext);

      return {
        ok: true,
        profile,
        protocolContext,
        protocolResolved: false as const,
        code: "PROTOCOL_RUNTIME_OK",
        message:
          "Canonical ProtocolProfile structural envelope (C-07 foundation — no concrete protocol / no resolution).",
      };
    });
  }

  async getProfile(input: GetProtocolProfileInput): Promise<GetProtocolProfileResult> {
    return this.runOperation("getProfile", input, async () => {
      if (input.profileId) {
        const profile = this.store.getProfile(input.profileId);
        if (!profile) {
          return {
            ok: false,
            code: "PROTOCOL_RUNTIME_NOT_FOUND",
            message: "Canonical ProtocolProfile not found.",
          };
        }
        return {
          ok: true,
          profile,
          code: "PROTOCOL_RUNTIME_OK",
          message: "Canonical ProtocolProfile loaded.",
        };
      }
      if (input.contextId) {
        const protocolContext = this.store.getContext(input.contextId);
        if (!protocolContext) {
          return {
            ok: false,
            code: "PROTOCOL_RUNTIME_NOT_FOUND",
            message: "Canonical ProtocolContext not found.",
          };
        }
        return {
          ok: true,
          protocolContext,
          profile: protocolContext.profile,
          code: "PROTOCOL_RUNTIME_OK",
          message: "Canonical ProtocolContext loaded.",
        };
      }
      return {
        ok: false,
        code: "PROTOCOL_RUNTIME_INVALID_INPUT",
        message: "profileId or contextId is required.",
      };
    });
  }

  async listProfiles(input: ListProtocolProfilesInput = {}): Promise<ListProtocolProfilesResult> {
    return this.runOperation("listProfiles", input, async () => {
      let profiles = this.store.listProfiles();
      if (input.state != null) {
        profiles = profiles.filter((p) => p.state === input.state);
      }
      return {
        ok: true,
        profiles,
        contexts: this.store.listContexts(),
        statistics: this.store.statistics(),
        code: "PROTOCOL_RUNTIME_OK",
        message: `Listed ${profiles.length} canonical ProtocolProfiles / ${this.store.contextCount()} contexts.`,
      };
    });
  }

  async resolveProtocol(input: ResolveProtocolInput): Promise<ResolveProtocolResult> {
    return this.runOperation("resolveProtocol", input, async () => {
      const stamp = nowIso(this.now);
      const capabilities =
        input.protocolCapabilities ??
        input.profile?.requiredCapabilities ??
        createEmptyProtocolCapabilities();
      const resolver = createEmptyProtocolResolver({
        ...input.resolver,
        resolverId: input.resolver?.resolverId ?? createProtocolResolverId(),
        name: input.resolver?.name ?? "Structural Protocol Resolver",
        operatorCapabilityProfile:
          input.operatorCapabilityProfile ?? input.resolver?.operatorCapabilityProfile,
        protocolCapabilities: capabilities,
        resolvedProfile: undefined,
        notes:
          "Structural resolveProtocol envelope — protocolResolutionImplemented=false (RULE_12). Future resolution = OperatorCapabilityProfile + ProtocolCapabilities.",
      });
      this.store.setResolver(resolver);

      const profile =
        input.profile ??
        createEmptyProtocolProfile({
          profileId: createProtocolProfileId(),
          profileName: "Unresolved structural profile",
          state: "PENDING_RESOLUTION",
          requiredCapabilities: capabilities,
          operatorCapabilityProfile: input.operatorCapabilityProfile,
          creationTimestamp: stamp,
        });
      this.store.setProfile(profile);

      const protocolContext: ProtocolContext = {
        ...(input.protocolContext ?? {
          kind: "canonical-protocol-context" as const,
          contextId: createProtocolContextId(),
        }),
        kind: "canonical-protocol-context",
        contextId: input.protocolContext?.contextId ?? createProtocolContextId(),
        profileId: profile.profileId,
        profile,
        resolver,
        state: "PENDING_RESOLUTION",
        operatorCapabilityProfile: input.operatorCapabilityProfile,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: "PENDING_RESOLUTION",
        executionDuration: 0,
        processedItems: 0,
        warnings: ["protocolResolutionImplemented=false — no concrete protocol selected (RULE_12)"],
        errors: [],
        structuralNotes:
          "Structural ProtocolResolver contract only — no SOAP/REST/gRPC/messaging selection.",
      };
      this.store.setContext(protocolContext);

      return {
        ok: true,
        resolver,
        profile,
        protocolContext,
        protocolResolved: false as const,
        protocolResolutionImplemented: false as const,
        code: "PROTOCOL_RUNTIME_RESOLUTION_NOT_IMPLEMENTED",
        message:
          "Canonical ProtocolResolver structural envelope (C-07 — no functional protocol resolution; SOAP/REST/gRPC/messaging remain future Adapters).",
      };
    });
  }

  async stats(input: ProtocolStatsInput = {}): Promise<ProtocolStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const profile = createEmptyProtocolProfile({
        profileId: createProtocolProfileId(),
        profileName: "Protocol Runtime structural statistics",
        creationTimestamp: stamp,
        state: "DECLARED",
      });
      return {
        ok: true,
        statistics,
        profile,
        code: "PROTOCOL_RUNTIME_OK",
        message: `Protocol Runtime stats: ${statistics.totalProfiles} profiles / ${statistics.totalResolvers} resolvers.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: ProtocolRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & ProtocolRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createProtocolRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: ProtocolRuntimeStructuredLog[] = [];
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
            code: "PROTOCOL_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & ProtocolRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "PROTOCOL_RUNTIME_RETRY",
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
              reject(new Error("Protocol Runtime operation timed out."));
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
        code: "PROTOCOL_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Protocol Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ProtocolRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Protocol Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "PROTOCOL_RUNTIME_CANCELLED"
          : isTimeout
            ? "PROTOCOL_RUNTIME_TIMEOUT"
            : "PROTOCOL_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & ProtocolRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-07). */
export const EnterpriseProtocolRuntimeAdapter = DefaultProtocolRuntimeAdapter;
