/**
 * ExecutionHealthCenterPort — contrato único da infraestrutura canônica de Health Center (INF-05).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente a infraestrutura de Health Center.
 * NÃO implementa monitoramento real. NÃO executa health checks reais.
 * Nenhuma operação consulta componentes, filas, workers, banco ou serviços externos.
 *
 * Integração com Observability: exclusivamente via ExecutionObservabilityPort (INF-04).
 */
import type {
  ComponentStatisticsResult,
  ExecutionHealthCenterPortCapabilities,
  ExecutionHealthCenterPortHealth,
  GetComponentInput,
  GetComponentResult,
  HealthCenterFoundationProviderId,
  ListComponentsInput,
  ListComponentsResult,
  RegisterComponentInput,
  RegisterComponentResult,
  UnregisterComponentInput,
  UnregisterComponentResult,
} from "./types";

export interface ExecutionHealthCenterPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: HealthCenterFoundationProviderId;

  /** Registra estruturalmente um Component no store in-memory (sem monitoramento real). */
  registerComponent(input: RegisterComponentInput): Promise<RegisterComponentResult>;

  /** Remove estruturalmente o registro de um Component (sem teardown real). */
  unregisterComponent(input: UnregisterComponentInput): Promise<UnregisterComponentResult>;

  /** Obtém / cria estruturalmente um Component canônico. */
  getComponent(input: GetComponentInput): Promise<GetComponentResult>;

  /** Lista estruturalmente Components do store in-memory. */
  listComponents(input?: ListComponentsInput): Promise<ListComponentsResult>;

  /** Estatísticas estruturais do store in-memory. */
  statistics(): Promise<ComponentStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar Components / sem health checks reais). */
  health(): Promise<ExecutionHealthCenterPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionHealthCenterPortCapabilities;
}
