/**
 * WorkerRuntimePort — contrato único do Enterprise Worker Runtime (INF-06).
 *
 * Application / Enterprise Runtime / Queue Runtime / TISS Runtime dependem
 * exclusivamente desta interface para gerenciar Workers canônicos estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → WorkerRuntimePort
 *     → Adapter → Worker Runtime Store → Canonical Worker Result
 *
 * INF-06: infraestrutura canônica apenas — sem Workers reais / Scheduler / Thread Pool.
 */
import type {
  AllocateWorkerInput,
  AllocateWorkerResult,
  HeartbeatWorkerInput,
  HeartbeatWorkerResult,
  RegisterWorkerInput,
  RegisterWorkerResult,
  ReleaseWorkerInput,
  ReleaseWorkerResult,
  UnregisterWorkerInput,
  UnregisterWorkerResult,
  WorkerRuntimeHealth,
  WorkerRuntimeInfo,
  WorkerRuntimePortCapabilities,
  WorkerRuntimeProviderId,
  WorkerStatsInput,
  WorkerStatsResult,
} from "./types";

export interface WorkerRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: WorkerRuntimeProviderId;

  /**
   * Registra estruturalmente um Worker no store in-memory.
   * NÃO cria threads. NÃO executa tarefas. NÃO agenda jobs.
   */
  register(input: RegisterWorkerInput): Promise<RegisterWorkerResult>;

  /**
   * Remove estruturalmente um Worker do store.
   * NÃO interrompe processamento real (não há processamento).
   */
  unregister(input: UnregisterWorkerInput): Promise<UnregisterWorkerResult>;

  /**
   * Aloca estruturalmente um Worker (marca estado canônico).
   * NÃO executa task. NÃO consome Queue. NÃO processa em paralelo.
   */
  allocate(input: AllocateWorkerInput): Promise<AllocateWorkerResult>;

  /**
   * Libera estruturalmente um Worker alocado.
   * NÃO afeta backends reais / schedulers / thread pools.
   */
  release(input: ReleaseWorkerInput): Promise<ReleaseWorkerResult>;

  /**
   * Registra heartbeat estrutural (atualiza timestamp in-memory).
   * NÃO implica liveness de processo real.
   */
  heartbeat(input: HeartbeatWorkerInput): Promise<HeartbeatWorkerResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: WorkerStatsInput): Promise<WorkerStatsResult>;

  /** Verificação leve de prontidão (sem alterar Workers). */
  health(): Promise<WorkerRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): WorkerRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): WorkerRuntimeInfo;
}
