/**
 * InMemoryScalabilityRuntimeStore — store in-process (INF-10).
 *
 * Implementação oficial do Scalability Runtime Store.
 * Sem banco. Sem OpenTelemetry. Sem Application Insights. Sem Prometheus/Grafana.
 * Sem logs/métricas/tracing reais.
 */
import type { CanonicalScalabilityStatistics } from "../ports/canonical";
import type {
  ScalabilityRuntimeStore,
  StoredCanonicalScalabilityEnvelope,
  StoredCanonicalScalabilitySignal,
  StoredCanonicalScalabilityScope,
} from "./scalability-runtime-store";

export const IN_MEMORY_SCALABILITY_RUNTIME_STORE_ID = "in-memory-scalability-runtime";

export type InMemoryScalabilityRuntimeStoreOptions = {
  scopes?: readonly StoredCanonicalScalabilityScope[];
  signals?: readonly StoredCanonicalScalabilitySignal[];
  envelopes?: readonly StoredCanonicalScalabilityEnvelope[];
};

/**
 * Store de ScalabilityScopes/Signals/Envelopes canônicos in-memory — exclusivo do Adapter (INF-10).
 */
export class InMemoryScalabilityRuntimeStore implements ScalabilityRuntimeStore {
  readonly storeId = IN_MEMORY_SCALABILITY_RUNTIME_STORE_ID;

  private readonly scopes = new Map<string, StoredCanonicalScalabilityScope>();
  private readonly byName = new Map<string, string>();
  private readonly signals = new Map<string, StoredCanonicalScalabilitySignal>();
  private readonly envelopes = new Map<string, StoredCanonicalScalabilityEnvelope>();

  constructor(options: InMemoryScalabilityRuntimeStoreOptions = {}) {
    for (const scope of options.scopes ?? []) {
      this.setScope(scope);
    }
    for (const signal of options.signals ?? []) {
      this.setSignal(signal);
    }
    for (const envelope of options.envelopes ?? []) {
      this.setEnvelope(envelope);
    }
  }

  getScope(scopeId: string): StoredCanonicalScalabilityScope | undefined {
    const scope = this.scopes.get(scopeId);
    return scope ? { ...scope } : undefined;
  }

  getScopeByName(scopeName: string): StoredCanonicalScalabilityScope | undefined {
    const scopeId = this.byName.get(scopeName);
    if (!scopeId) return undefined;
    return this.getScope(scopeId);
  }

  setScope(scope: StoredCanonicalScalabilityScope): void {
    this.scopes.set(scope.scopeId, { ...scope });
    this.byName.set(scope.scopeName, scope.scopeId);
  }

  removeScope(scopeId: string): void {
    const existing = this.scopes.get(scopeId);
    if (existing) {
      this.byName.delete(existing.scopeName);
      this.scopes.delete(scopeId);
    }
  }

  listScopes(): readonly StoredCanonicalScalabilityScope[] {
    return Array.from(this.scopes.values()).map((scope) => ({ ...scope }));
  }

  getSignal(signalId: string): StoredCanonicalScalabilitySignal | undefined {
    const signal = this.signals.get(signalId);
    return signal ? { ...signal } : undefined;
  }

  setSignal(signal: StoredCanonicalScalabilitySignal): void {
    this.signals.set(signal.signalId, { ...signal });
  }

  listSignals(scopeId?: string): readonly StoredCanonicalScalabilitySignal[] {
    const all = Array.from(this.signals.values()).map((signal) => ({ ...signal }));
    if (!scopeId) return all;
    return all.filter((signal) => signal.scopeId === scopeId);
  }

  getEnvelope(envelopeId: string): StoredCanonicalScalabilityEnvelope | undefined {
    const envelope = this.envelopes.get(envelopeId);
    return envelope ? { ...envelope } : undefined;
  }

  setEnvelope(envelope: StoredCanonicalScalabilityEnvelope): void {
    this.envelopes.set(envelope.envelopeId, { ...envelope });
  }

  listEnvelopes(scopeId?: string): readonly StoredCanonicalScalabilityEnvelope[] {
    const all = Array.from(this.envelopes.values()).map((envelope) => ({ ...envelope }));
    if (!scopeId) return all;
    return all.filter((envelope) => envelope.scopeId === scopeId);
  }

  scopeCount(): number {
    return this.scopes.size;
  }

  signalCount(): number {
    return this.signals.size;
  }

  envelopeCount(): number {
    return this.envelopes.size;
  }

  statistics(): CanonicalScalabilityStatistics {
    const all = this.listScopes();
    let registered = 0;
    let active = 0;
    let released = 0;
    for (const scope of all) {
      if (scope.status === "registered" || scope.status === "idle") registered += 1;
      if (scope.active || scope.status === "observed") active += 1;
      if (scope.status === "released") released += 1;
    }
    return {
      kind: "canonical-scalability-statistics",
      totalScopes: all.length,
      registeredScopes: registered,
      activeScopes: active,
      releasedScopes: released,
      totalSignals: this.signalCount(),
      totalEnvelopes: this.envelopeCount(),
      realScalabilityBackendCount: 0,
      kubernetesImplementedCount: 0,
      dockerSwarmImplementedCount: 0,
      azureScaleSetImplementedCount: 0,
      horizontalPodAutoscalerImplementedCount: 0,
      autoScalingImplementedCount: 0,
      clusterImplementedCount: 0,
      loadBalancerImplementedCount: 0,
      failoverImplementedCount: 0,
      shardingImplementedCount: 0,
      partitioningImplementedCount: 0,
      horizontalScalingImplementedCount: 0,
      verticalScalingImplementedCount: 0,
      nodeManagementImplementedCount: 0,
      highAvailabilityImplementedCount: 0,
      elasticScalingImplementedCount: 0,
      capacityPlanningImplementedCount: 0,
      realScalabilityOrchestrationImplementedCount: 0,
      realDistributedProcessingImplementedCount: 0,
      realExternalIntegrationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Scalability Runtime store ready (${this.scopeCount()} scopes, ${this.signalCount()} signals, ${this.envelopeCount()} envelopes).`,
    };
  }
}
