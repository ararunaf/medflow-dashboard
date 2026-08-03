/**
 * ScalabilityRuntimePort — contrato único do Enterprise Scalability Runtime (INF-10).
 *
 * Application / Enterprise Runtime / Queue Runtime / Worker Runtime / Scheduler Runtime /
 * Persistent Queue Runtime / TISS Runtime dependem exclusivamente desta interface para
 * gerenciar ScalabilityScopes canônicos estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → ScalabilityRuntimePort
 *     → Adapter → Scalability Runtime Store → Canonical Scalability Result
 *
 * INF-10: infraestrutura canônica apenas — sem OpenTelemetry / Azure Monitor /
 * Application Insights / Prometheus / Grafana / Elastic / Datadog / New Relic /
 * Loki / Jaeger / logs / métricas / tracing / alertas / dashboards reais.
 */
import type {
  ReleaseSignalInput,
  ReleaseSignalResult,
  ListScalabilityScopesInput,
  ListScalabilityScopesResult,
  RegisterScalabilityScopeInput,
  RegisterScalabilityScopeResult,
  ObserveSignalInput,
  ObserveSignalResult,
  ScalabilityRuntimeHealth,
  ScalabilityRuntimeInfo,
  ScalabilityRuntimePortCapabilities,
  ScalabilityRuntimeProviderId,
  ScalabilityStatsInput,
  ScalabilityStatsResult,
  UnregisterScalabilityScopeInput,
  UnregisterScalabilityScopeResult,
} from "./types";

export interface ScalabilityRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ScalabilityRuntimeProviderId;

  /**
   * Registra estruturalmente um ScalabilityScope no store in-memory.
   * NÃO cria scopes reais. NÃO emite telemetria. NÃO integra backends externos.
   */
  register(input: RegisterScalabilityScopeInput): Promise<RegisterScalabilityScopeResult>;

  /**
   * Remove estruturalmente um ScalabilityScope do store.
   * NÃO remove backends reais (não há backends).
   */
  unregister(input: UnregisterScalabilityScopeInput): Promise<UnregisterScalabilityScopeResult>;

  /**
   * Emite estruturalmente um signal canônico (marca estado no store in-memory).
   * NÃO usa OpenTelemetry/App Insights/Prometheus/Grafana. NÃO gera logs/métricas/tracing reais.
   */
  observe(input: ObserveSignalInput): Promise<ObserveSignalResult>;

  /**
   * Libera estruturalmente um ScalabilityScope / Signal.
   * NÃO afeta backends reais / dashboards / alertas.
   */
  release(input: ReleaseSignalInput): Promise<ReleaseSignalResult>;

  /**
   * Lista estruturalmente ScalabilityScopes / Signals do store in-memory.
   */
  list(input?: ListScalabilityScopesInput): Promise<ListScalabilityScopesResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: ScalabilityStatsInput): Promise<ScalabilityStatsResult>;

  /** Verificação leve de prontidão (sem alterar ScalabilityScopes). */
  health(): Promise<ScalabilityRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ScalabilityRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): ScalabilityRuntimeInfo;
}
