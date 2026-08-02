/**
 * ExecutionObservabilityPort — contrato único da infraestrutura canônica de observabilidade (INF-04).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente a infraestrutura de Observabilidade.
 * NÃO implementa logs reais. NÃO coleta métricas. NÃO faz tracing.
 * Nenhuma operação gera telemetria ou transmite eventos.
 *
 * Integração com Schedulers: exclusivamente via ExecutionSchedulerPort (INF-03).
 */
import type {
  ExecutionObservabilityPortCapabilities,
  ExecutionObservabilityPortHealth,
  GetObservationInput,
  GetObservationResult,
  ListObservationsInput,
  ListObservationsResult,
  ObservationStatisticsResult,
  ObservabilityFoundationProviderId,
  RegisterObservationInput,
  RegisterObservationResult,
  UnregisterObservationInput,
  UnregisterObservationResult,
} from "./types";

export interface ExecutionObservabilityPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ObservabilityFoundationProviderId;

  /** Registra estruturalmente uma Observation no store in-memory (sem monitoramento real). */
  registerObservation(input: RegisterObservationInput): Promise<RegisterObservationResult>;

  /** Remove estruturalmente o registro de uma Observation (sem teardown real). */
  unregisterObservation(input: UnregisterObservationInput): Promise<UnregisterObservationResult>;

  /** Obtém / cria estruturalmente uma Observation canônica. */
  getObservation(input: GetObservationInput): Promise<GetObservationResult>;

  /** Lista estruturalmente Observations do store in-memory. */
  listObservations(input?: ListObservationsInput): Promise<ListObservationsResult>;

  /** Estatísticas estruturais do store in-memory. */
  statistics(): Promise<ObservationStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar Observations). */
  health(): Promise<ExecutionObservabilityPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionObservabilityPortCapabilities;
}
