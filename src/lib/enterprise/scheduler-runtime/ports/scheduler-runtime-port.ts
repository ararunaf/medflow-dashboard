/**
 * SchedulerRuntimePort — contrato único do Enterprise Scheduler Runtime (INF-07 / OPER-INF-S).
 *
 * Application / Enterprise Runtime / Queue Runtime / Worker Runtime / TISS Runtime
 * dependem exclusivamente desta interface para gerenciar Schedules canônicos.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → SchedulerRuntimePort
 *     → Adapter → SchedulerWorkerDispatcher → WorkerRuntimePort
 *       → QueueRuntimePort → Backend Persistente
 *
 * OPER-INF-S: implementação operacional via WorkerRuntimePort — interface pública inalterada.
 */
import type {
  CancelScheduleInput,
  CancelScheduleResult,
  ListSchedulesInput,
  ListSchedulesResult,
  RegisterScheduleInput,
  RegisterScheduleResult,
  ScheduleJobInput,
  ScheduleJobResult,
  SchedulerRuntimeHealth,
  SchedulerRuntimeInfo,
  SchedulerRuntimePortCapabilities,
  SchedulerRuntimeProviderId,
  SchedulerStatsInput,
  SchedulerStatsResult,
  UnregisterScheduleInput,
  UnregisterScheduleResult,
} from "./types";

export interface SchedulerRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: SchedulerRuntimeProviderId;

  /**
   * Registra um Schedule no store.
   * OPER-INF-S: não inicia poll — schedule ativa o dispatcher temporal.
   */
  register(input: RegisterScheduleInput): Promise<RegisterScheduleResult>;

  /**
   * Remove um Schedule do store.
   * OPER-INF-S: encerra graceful shutdown do poll se ativo.
   */
  unregister(input: UnregisterScheduleInput): Promise<UnregisterScheduleResult>;

  /**
   * Agenda um Job.
   * OPER-INF-S: inicia polling temporal e aciona WorkerRuntimePort quando due.
   */
  schedule(input: ScheduleJobInput): Promise<ScheduleJobResult>;

  /**
   * Cancela um Schedule / Job.
   * OPER-INF-S: graceful shutdown do dispatcher e release do Worker alocado.
   */
  cancel(input: CancelScheduleInput): Promise<CancelScheduleResult>;

  /**
   * Lista Schedules / Jobs do store.
   */
  list(input?: ListSchedulesInput): Promise<ListSchedulesResult>;

  /**
   * Estatísticas do Scheduler Runtime (store + contadores operacionais).
   */
  stats(input?: SchedulerStatsInput): Promise<SchedulerStatsResult>;

  /** Verificação leve de prontidão (sem alterar Schedules). */
  health(): Promise<SchedulerRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): SchedulerRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): SchedulerRuntimeInfo;
}
