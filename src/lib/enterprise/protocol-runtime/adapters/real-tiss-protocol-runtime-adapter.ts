/**
 * RealTissProtocolRuntimeAdapter — A7-02.
 *
 * Adapter real de protocolo TISS para o provider `real-tiss`.
 *
 * Reutiliza `DefaultProtocolRuntimeAdapter` para ciclo de vida, retry,
 * cancelamento/AbortSignal, observability, health, capabilities, providerInfo,
 * storage e statistics.
 *
 * Sem alterar EnterpriseRuntime, Runtime, Queue, Worker, Scheduler, Retry,
 * Dead Letter, Observability, Pipeline, Foundations, Composition Root.
 *
 * Ponto de extensão para futuros protocolos: SOAP, REST, gRPC, mensageria.
 * Nenhum protocolo concreto é implementado nesta Sprint.
 */
import {
  DefaultProtocolRuntimeAdapter,
  type DefaultProtocolRuntimeAdapterOptions,
} from "./default-protocol-runtime-adapter";
import type { ProtocolRuntimePort } from "../ports/protocol-runtime-port";
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
  ProtocolRuntimeProviderId,
  ProtocolStatsInput,
  ProtocolStatsResult,
  ResolveProtocolInput,
  ResolveProtocolResult,
} from "../ports/types";
import type { ProtocolRuntimeStore } from "../store";

export const REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID = "real-tiss-protocol-runtime";
export const REAL_TISS_PROTOCOL_RUNTIME_VERSION = "1.0.0";

export type RealTissProtocolRuntimeAdapterOptions = {
  provider?: Extract<ProtocolRuntimeProviderId, "real-tiss">;
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

function realTissPrepareInput(input: PrepareProtocolProfileInput): PrepareProtocolProfileInput {
  return {
    ...input,
    profileName:
      input.profileName ?? `TISS real protocol ${input.protocolContext?.contextId ?? ""}`,
    abstractProtocolRef: input.abstractProtocolRef ?? "tiss-ans-3.05.00",
    state: input.state ?? "PENDING_RESOLUTION",
    owner: input.owner ?? "real-tiss",
    tags: input.tags ?? ["real-tiss", "tiss-protocol", "ans-3.05.00"],
    protocolContext: {
      ...(input.protocolContext ?? { kind: "canonical-protocol-context" as const }),
      kind: "canonical-protocol-context",
      structuralNotes:
        input.protocolContext?.structuralNotes ??
        "Real TISS protocol profile prepared for future ANS SOAP resolution.",
    },
  };
}

export class RealTissProtocolRuntimeAdapter implements ProtocolRuntimePort {
  readonly providerId: Extract<ProtocolRuntimeProviderId, "real-tiss">;

  private readonly delegate: DefaultProtocolRuntimeAdapter;
  private readonly metadata: ProtocolRuntimeInfo["metadata"];

  constructor(options: RealTissProtocolRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "real-tiss";
    this.delegate = new DefaultProtocolRuntimeAdapter({
      provider: "enterprise",
      healthy: options.healthy ?? true,
      message:
        options.message ??
        "Real TISS Protocol Runtime ready (structural — no concrete protocol resolution).",
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
      defaultTimeoutMs: options.defaultTimeoutMs,
      defaultRetryCount: options.defaultRetryCount,
      defaultRetryBackoffMs: options.defaultRetryBackoffMs,
      now: options.now,
      sleep: options.sleep,
      failAttempts: options.failAttempts,
    } as DefaultProtocolRuntimeAdapterOptions);

    this.metadata = {
      name: "Real TISS Protocol Runtime",
      version: REAL_TISS_PROTOCOL_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      layer: "Foundation",
      vendorAgnostic: true,
      description:
        "Real TISS protocol adapter — prepares ProtocolProfile for future ANS SOAP resolution.",
    };
  }

  getStore(): ProtocolRuntimeStore {
    return this.delegate.getStore();
  }

  async prepareProfile(input: PrepareProtocolProfileInput): Promise<PrepareProtocolProfileResult> {
    const res = await this.delegate.prepareProfile(realTissPrepareInput(input));
    return { ...res, provider: this.providerId };
  }

  async getProfile(input: GetProtocolProfileInput): Promise<GetProtocolProfileResult> {
    const res = await this.delegate.getProfile(input);
    return { ...res, provider: this.providerId };
  }

  async listProfiles(input: ListProtocolProfilesInput = {}): Promise<ListProtocolProfilesResult> {
    const res = await this.delegate.listProfiles(input);
    return { ...res, provider: this.providerId };
  }

  async resolveProtocol(input: ResolveProtocolInput): Promise<ResolveProtocolResult> {
    const res = await this.delegate.resolveProtocol(input);
    if (!res.ok || !res.resolver) {
      return { ...res, provider: this.providerId };
    }

    const realResolver = {
      ...res.resolver,
      name: input.resolver?.name ?? "Real TISS Protocol Resolver",
      notes:
        input.resolver?.notes ??
        "Real TISS protocol resolver — ANS SOAP resolution planned for future sprint (no functional resolution).",
    };
    this.delegate.getStore().setResolver(realResolver);

    const realProtocolContext = res.protocolContext
      ? { ...res.protocolContext, resolver: realResolver }
      : undefined;
    if (realProtocolContext) {
      this.delegate.getStore().setContext(realProtocolContext);
    }

    return {
      ...res,
      provider: this.providerId,
      resolver: realResolver,
      protocolContext: realProtocolContext,
    };
  }

  async stats(input: ProtocolStatsInput = {}): Promise<ProtocolStatsResult> {
    const res = await this.delegate.stats(input);
    return { ...res, provider: this.providerId };
  }

  async health(): Promise<ProtocolRuntimeHealth> {
    const res = await this.delegate.health();
    return { ...res, provider: this.providerId };
  }

  capabilities(): ProtocolRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return { ...caps, provider: this.providerId, adapterId: REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID };
  }

  providerInfo(): ProtocolRuntimeInfo {
    const caps = this.delegate.capabilities();
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: "ready",
      providerType: "PROTOCOL_RUNTIME",
      capabilities: caps.engine ?? this.delegate.providerInfo().capabilities,
    };
  }
}
