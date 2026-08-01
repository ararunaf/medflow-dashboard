/**
 * ExecutionWorkerPort — contrato único da infraestrutura canônica de Workers (INF-02).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente a infraestrutura de Workers.
 * NÃO executa Workers. NÃO inicia threads. NÃO processa mensagens.
 * Nenhuma operação executa lógica real de background.
 *
 * Integração com filas: exclusivamente via ExecutionQueuePort (INF-01).
 */
import type {
  ExecutionWorkerPortCapabilities,
  ExecutionWorkerPortHealth,
  GetWorkerInput,
  GetWorkerResult,
  PauseWorkerInput,
  PauseWorkerResult,
  RegisterWorkerInput,
  RegisterWorkerResult,
  ResumeWorkerInput,
  ResumeWorkerResult,
  StartWorkerInput,
  StartWorkerResult,
  StopWorkerInput,
  StopWorkerResult,
  UnregisterWorkerInput,
  UnregisterWorkerResult,
  WorkerFoundationProviderId,
  WorkerStatisticsResult,
} from "./types";

export interface ExecutionWorkerPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: WorkerFoundationProviderId;

  /** Registra estruturalmente um Worker no store in-memory (sem execução real). */
  registerWorker(input: RegisterWorkerInput): Promise<RegisterWorkerResult>;

  /** Remove estruturalmente o registro de um Worker (sem teardown real). */
  unregisterWorker(input: UnregisterWorkerInput): Promise<UnregisterWorkerResult>;

  /** Marca estruturalmente Worker como started (sem threads / background jobs). */
  startWorker(input: StartWorkerInput): Promise<StartWorkerResult>;

  /** Marca estruturalmente Worker como stopped (sem interrupção real). */
  stopWorker(input: StopWorkerInput): Promise<StopWorkerResult>;

  /** Marca estruturalmente Worker como paused (sem pausa real). */
  pauseWorker(input: PauseWorkerInput): Promise<PauseWorkerResult>;

  /** Marca estruturalmente Worker como resumed (sem retomada real). */
  resumeWorker(input: ResumeWorkerInput): Promise<ResumeWorkerResult>;

  /** Obtém / cria estruturalmente um Worker canônico. */
  getWorker(input: GetWorkerInput): Promise<GetWorkerResult>;

  /** Estatísticas estruturais do store in-memory. */
  statistics(): Promise<WorkerStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar Workers). */
  health(): Promise<ExecutionWorkerPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionWorkerPortCapabilities;
}
