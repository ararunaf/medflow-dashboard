/**
 * WorkerRuntimePort — contrato único do Enterprise Worker Runtime (INF-06 / OPER-INF-W).
 *
 * Application / Enterprise Runtime / Queue Runtime / TISS Runtime dependem
 * exclusivamente desta interface para gerenciar Workers canônicos.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → WorkerRuntimePort
 *     → Adapter → QueueRuntimePort → Backend Persistente
 *
 * OPER-INF-W: implementação operacional via QueueRuntimePort — interface pública inalterada.
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
   * Registra um Worker no store.
   * OPER-INF-W: não inicia poll — allocate ativa o consumo via QueueRuntimePort.
   */
  register(input: RegisterWorkerInput): Promise<RegisterWorkerResult>;

  /**
   * Remove um Worker do store.
   * OPER-INF-W: encerra graceful shutdown do poll se ativo.
   */
  unregister(input: UnregisterWorkerInput): Promise<UnregisterWorkerResult>;

  /**
   * Aloca um Worker.
   * OPER-INF-W: inicia polling controlado / claim / lock via QueueRuntimePort.
   */
  allocate(input: AllocateWorkerInput): Promise<AllocateWorkerResult>;

  /**
   * Libera um Worker alocado.
   * OPER-INF-W: graceful shutdown do consumo de fila.
   */
  release(input: ReleaseWorkerInput): Promise<ReleaseWorkerResult>;

  /**
   * Registra heartbeat do Worker.
   * OPER-INF-W: renova lock local de processamento quando houver claim ativo.
   */
  heartbeat(input: HeartbeatWorkerInput): Promise<HeartbeatWorkerResult>;

  /**
   * Estatísticas do Worker Runtime (store + contadores operacionais).
   */
  stats(input?: WorkerStatsInput): Promise<WorkerStatsResult>;

  /** Verificação leve de prontidão (sem alterar Workers). */
  health(): Promise<WorkerRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): WorkerRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): WorkerRuntimeInfo;
}
