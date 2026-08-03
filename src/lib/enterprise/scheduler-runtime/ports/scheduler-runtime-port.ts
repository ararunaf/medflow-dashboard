/**
 * SchedulerRuntimePort — contrato único do Enterprise Scheduler Runtime (INF-07).
 *
 * Application / Enterprise Runtime / Queue Runtime / Worker Runtime / TISS Runtime
 * dependem exclusivamente desta interface para gerenciar Schedules canônicos estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → SchedulerRuntimePort
 *     → Adapter → Scheduler Runtime Store → Canonical Scheduler Result
 *
 * INF-07: infraestrutura canônica apenas — sem Scheduler real / Cron / Timer / Workers.
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
   * Registra estruturalmente um Schedule no store in-memory.
   * NÃO cria timers. NÃO agenda Cron. NÃO despacha Jobs.
   */
  register(input: RegisterScheduleInput): Promise<RegisterScheduleResult>;

  /**
   * Remove estruturalmente um Schedule do store.
   * NÃO cancela timers reais (não há timers).
   */
  unregister(input: UnregisterScheduleInput): Promise<UnregisterScheduleResult>;

  /**
   * Agenda estruturalmente um Job (marca estado canônico).
   * NÃO usa Cron. NÃO usa Timer. NÃO orquestra Workers. NÃO consome Queue.
   */
  schedule(input: ScheduleJobInput): Promise<ScheduleJobResult>;

  /**
   * Cancela estruturalmente um Schedule / Job.
   * NÃO afeta backends reais / cron / timers.
   */
  cancel(input: CancelScheduleInput): Promise<CancelScheduleResult>;

  /**
   * Lista estruturalmente Schedules / Jobs do store in-memory.
   */
  list(input?: ListSchedulesInput): Promise<ListSchedulesResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: SchedulerStatsInput): Promise<SchedulerStatsResult>;

  /** Verificação leve de prontidão (sem alterar Schedules). */
  health(): Promise<SchedulerRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): SchedulerRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): SchedulerRuntimeInfo;
}
