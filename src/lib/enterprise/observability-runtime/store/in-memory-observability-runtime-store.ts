/**
 * InMemoryObservabilityRuntimeStore — store in-process (INF-09).
 *
 * Implementação oficial do Observability Runtime Store.
 * Sem banco. Sem OpenTelemetry. Sem Application Insights. Sem Prometheus/Grafana.
 * Sem logs/métricas/tracing reais.
 */
import type { CanonicalObservabilityStatistics } from "../ports/canonical";
import type {
  ObservabilityRuntimeStore,
  StoredCanonicalObservabilityEnvelope,
  StoredCanonicalObservabilitySignal,
  StoredCanonicalObservabilityScope,
} from "./observability-runtime-store";

export const IN_MEMORY_OBSERVABILITY_RUNTIME_STORE_ID = "in-memory-observability-runtime";

export type InMemoryObservabilityRuntimeStoreOptions = {
  scopes?: readonly StoredCanonicalObservabilityScope[];
  signals?: readonly StoredCanonicalObservabilitySignal[];
  envelopes?: readonly StoredCanonicalObservabilityEnvelope[];
};

/**
 * Store de ObservabilityScopes/Signals/Envelopes canônicos in-memory — exclusivo do Adapter (INF-09).
 */
export class InMemoryObservabilityRuntimeStore implements ObservabilityRuntimeStore {
  readonly storeId = IN_MEMORY_OBSERVABILITY_RUNTIME_STORE_ID;

  private readonly scopes = new Map<string, StoredCanonicalObservabilityScope>();
  private readonly byName = new Map<string, string>();
  private readonly signals = new Map<string, StoredCanonicalObservabilitySignal>();
  private readonly envelopes = new Map<string, StoredCanonicalObservabilityEnvelope>();

  constructor(options: InMemoryObservabilityRuntimeStoreOptions = {}) {
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

  getScope(scopeId: string): StoredCanonicalObservabilityScope | undefined {
    const scope = this.scopes.get(scopeId);
    return scope ? { ...scope } : undefined;
  }

  getScopeByName(scopeName: string): StoredCanonicalObservabilityScope | undefined {
    const scopeId = this.byName.get(scopeName);
    if (!scopeId) return undefined;
    return this.getScope(scopeId);
  }

  setScope(scope: StoredCanonicalObservabilityScope): void {
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

  listScopes(): readonly StoredCanonicalObservabilityScope[] {
    return Array.from(this.scopes.values()).map((scope) => ({ ...scope }));
  }

  getSignal(signalId: string): StoredCanonicalObservabilitySignal | undefined {
    const signal = this.signals.get(signalId);
    return signal ? { ...signal } : undefined;
  }

  setSignal(signal: StoredCanonicalObservabilitySignal): void {
    this.signals.set(signal.signalId, { ...signal });
  }

  listSignals(scopeId?: string): readonly StoredCanonicalObservabilitySignal[] {
    const all = Array.from(this.signals.values()).map((signal) => ({ ...signal }));
    if (!scopeId) return all;
    return all.filter((signal) => signal.scopeId === scopeId);
  }

  getEnvelope(envelopeId: string): StoredCanonicalObservabilityEnvelope | undefined {
    const envelope = this.envelopes.get(envelopeId);
    return envelope ? { ...envelope } : undefined;
  }

  setEnvelope(envelope: StoredCanonicalObservabilityEnvelope): void {
    this.envelopes.set(envelope.envelopeId, { ...envelope });
  }

  listEnvelopes(scopeId?: string): readonly StoredCanonicalObservabilityEnvelope[] {
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

  statistics(): CanonicalObservabilityStatistics {
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
      kind: "canonical-observability-statistics",
      totalScopes: all.length,
      registeredScopes: registered,
      activeScopes: active,
      releasedScopes: released,
      totalSignals: this.signalCount(),
      totalEnvelopes: this.envelopeCount(),
      realObservabilityBackendCount: 0,
      openTelemetryImplementedCount: 0,
      applicationInsightsImplementedCount: 0,
      azureMonitorImplementedCount: 0,
      prometheusImplementedCount: 0,
      grafanaImplementedCount: 0,
      elasticImplementedCount: 0,
      datadogImplementedCount: 0,
      newRelicImplementedCount: 0,
      lokiImplementedCount: 0,
      jaegerImplementedCount: 0,
      realLogsImplementedCount: 0,
      realMetricsImplementedCount: 0,
      realTracingImplementedCount: 0,
      distributedTracingImplementedCount: 0,
      realAlertsImplementedCount: 0,
      realDashboardsImplementedCount: 0,
      realTelemetryImplementedCount: 0,
      realHealthMonitoringImplementedCount: 0,
      realPerformanceMonitoringImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Observability Runtime store ready (${this.scopeCount()} scopes, ${this.signalCount()} signals, ${this.envelopeCount()} envelopes).`,
    };
  }
}
