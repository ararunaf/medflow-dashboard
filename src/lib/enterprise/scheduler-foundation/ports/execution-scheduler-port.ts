/**
 * ExecutionSchedulerPort — contrato único da infraestrutura canônica de agendamento (INF-03).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente a infraestrutura de Schedulers.
 * NÃO executa agendamentos. NÃO utiliza cron. NÃO cria timers.
 * Nenhuma operação executa lógica real de scheduling.
 *
 * Integração com Workers: exclusivamente via ExecutionWorkerPort (INF-02).
 */
import type {
  DisableScheduleInput,
  DisableScheduleResult,
  EnableScheduleInput,
  EnableScheduleResult,
  ExecutionSchedulerPortCapabilities,
  ExecutionSchedulerPortHealth,
  GetScheduleInput,
  GetScheduleResult,
  ListSchedulesInput,
  ListSchedulesResult,
  PauseScheduleInput,
  PauseScheduleResult,
  RegisterScheduleInput,
  RegisterScheduleResult,
  ResumeScheduleInput,
  ResumeScheduleResult,
  ScheduleStatisticsResult,
  SchedulerFoundationProviderId,
  UnregisterScheduleInput,
  UnregisterScheduleResult,
} from "./types";

export interface ExecutionSchedulerPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: SchedulerFoundationProviderId;

  /** Registra estruturalmente um Schedule no store in-memory (sem execução real). */
  registerSchedule(input: RegisterScheduleInput): Promise<RegisterScheduleResult>;

  /** Remove estruturalmente o registro de um Schedule (sem teardown real). */
  unregisterSchedule(input: UnregisterScheduleInput): Promise<UnregisterScheduleResult>;

  /** Marca estruturalmente Schedule como enabled (sem cron / timers / jobs). */
  enableSchedule(input: EnableScheduleInput): Promise<EnableScheduleResult>;

  /** Marca estruturalmente Schedule como disabled (sem interrupção real). */
  disableSchedule(input: DisableScheduleInput): Promise<DisableScheduleResult>;

  /** Marca estruturalmente Schedule como paused (sem pausa real). */
  pauseSchedule(input: PauseScheduleInput): Promise<PauseScheduleResult>;

  /** Marca estruturalmente Schedule como resumed (sem retomada real). */
  resumeSchedule(input: ResumeScheduleInput): Promise<ResumeScheduleResult>;

  /** Obtém / cria estruturalmente um Schedule canônico. */
  getSchedule(input: GetScheduleInput): Promise<GetScheduleResult>;

  /** Lista estruturalmente Schedules do store in-memory. */
  listSchedules(input?: ListSchedulesInput): Promise<ListSchedulesResult>;

  /** Estatísticas estruturais do store in-memory. */
  statistics(): Promise<ScheduleStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar Schedules). */
  health(): Promise<ExecutionSchedulerPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionSchedulerPortCapabilities;
}
