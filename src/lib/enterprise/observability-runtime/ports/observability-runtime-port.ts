/**
 * ObservabilityRuntimePort — contrato único do Enterprise Observability Runtime (INF-09).
 *
 * Application / Enterprise Runtime / Queue Runtime / Worker Runtime / Scheduler Runtime /
 * Persistent Queue Runtime / TISS Runtime dependem exclusivamente desta interface para
 * gerenciar ObservabilityScopes canônicos estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → ObservabilityRuntimePort
 *     → Adapter → Observability Runtime Store → Canonical Observability Result
 *
 * INF-09: infraestrutura canônica apenas — sem OpenTelemetry / Azure Monitor /
 * Application Insights / Prometheus / Grafana / Elastic / Datadog / New Relic /
 * Loki / Jaeger / logs / métricas / tracing / alertas / dashboards reais.
 */
import type {
  ReleaseSignalInput,
  ReleaseSignalResult,
  ListObservabilityScopesInput,
  ListObservabilityScopesResult,
  RegisterObservabilityScopeInput,
  RegisterObservabilityScopeResult,
  ObserveSignalInput,
  ObserveSignalResult,
  ObservabilityRuntimeHealth,
  ObservabilityRuntimeInfo,
  ObservabilityRuntimePortCapabilities,
  ObservabilityRuntimeProviderId,
  ObservabilityStatsInput,
  ObservabilityStatsResult,
  UnregisterObservabilityScopeInput,
  UnregisterObservabilityScopeResult,
} from "./types";

export interface ObservabilityRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ObservabilityRuntimeProviderId;

  /**
   * Registra estruturalmente um ObservabilityScope no store in-memory.
   * NÃO cria scopes reais. NÃO emite telemetria. NÃO integra backends externos.
   */
  register(input: RegisterObservabilityScopeInput): Promise<RegisterObservabilityScopeResult>;

  /**
   * Remove estruturalmente um ObservabilityScope do store.
   * NÃO remove backends reais (não há backends).
   */
  unregister(input: UnregisterObservabilityScopeInput): Promise<UnregisterObservabilityScopeResult>;

  /**
   * Emite estruturalmente um signal canônico (marca estado no store in-memory).
   * NÃO usa OpenTelemetry/App Insights/Prometheus/Grafana. NÃO gera logs/métricas/tracing reais.
   */
  observe(input: ObserveSignalInput): Promise<ObserveSignalResult>;

  /**
   * Libera estruturalmente um ObservabilityScope / Signal.
   * NÃO afeta backends reais / dashboards / alertas.
   */
  release(input: ReleaseSignalInput): Promise<ReleaseSignalResult>;

  /**
   * Lista estruturalmente ObservabilityScopes / Signals do store in-memory.
   */
  list(input?: ListObservabilityScopesInput): Promise<ListObservabilityScopesResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: ObservabilityStatsInput): Promise<ObservabilityStatsResult>;

  /** Verificação leve de prontidão (sem alterar ObservabilityScopes). */
  health(): Promise<ObservabilityRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ObservabilityRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): ObservabilityRuntimeInfo;
}
