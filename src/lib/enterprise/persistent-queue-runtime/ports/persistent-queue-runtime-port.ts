/**
 * PersistentQueueRuntimePort — contrato único do Enterprise Persistent Queue Runtime (INF-08).
 *
 * Application / Enterprise Runtime / Queue Runtime / Worker Runtime / Scheduler Runtime / TISS Runtime
 * dependem exclusivamente desta interface para gerenciar PersistentQueues canônicos estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → PersistentQueueRuntimePort
 *     → Adapter → Persistent Queue Runtime Store → Canonical Persistent Queue Result
 *
 * INF-08: infraestrutura canônica apenas — sem backends persistentes reais / RabbitMQ / Kafka / Workers.
 */
import type {
  ReleaseMessageInput,
  ReleaseMessageResult,
  ListPersistentQueuesInput,
  ListPersistentQueuesResult,
  RegisterPersistentQueueInput,
  RegisterPersistentQueueResult,
  PersistMessageInput,
  PersistMessageResult,
  PersistentQueueRuntimeHealth,
  PersistentQueueRuntimeInfo,
  PersistentQueueRuntimePortCapabilities,
  PersistentQueueRuntimeProviderId,
  PersistentQueueStatsInput,
  PersistentQueueStatsResult,
  UnregisterPersistentQueueInput,
  UnregisterPersistentQueueResult,
} from "./types";

export interface PersistentQueueRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: PersistentQueueRuntimeProviderId;

  /**
   * Registra estruturalmente um PersistentQueue no store in-memory.
   * NÃO cria filas reais. NÃO persiste em banco. NÃO publica em backends.
   */
  register(input: RegisterPersistentQueueInput): Promise<RegisterPersistentQueueResult>;

  /**
   * Remove estruturalmente um PersistentQueue do store.
   * NÃO remove backends reais (não há backends).
   */
  unregister(input: UnregisterPersistentQueueInput): Promise<UnregisterPersistentQueueResult>;

  /**
   * Persiste estruturalmente uma mensagem canônica (marca estado no store in-memory).
   * NÃO usa RabbitMQ/Kafka/Azure/Redis/BullMQ. NÃO persiste em banco. NÃO invoca Workers.
   */
  persist(input: PersistMessageInput): Promise<PersistMessageResult>;

  /**
   * Libera estruturalmente uma PersistentQueue / Message.
   * NÃO afeta backends reais / DLQ / retry queues.
   */
  release(input: ReleaseMessageInput): Promise<ReleaseMessageResult>;

  /**
   * Lista estruturalmente PersistentQueues / Messages do store in-memory.
   */
  list(input?: ListPersistentQueuesInput): Promise<ListPersistentQueuesResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: PersistentQueueStatsInput): Promise<PersistentQueueStatsResult>;

  /** Verificação leve de prontidão (sem alterar PersistentQueues). */
  health(): Promise<PersistentQueueRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): PersistentQueueRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): PersistentQueueRuntimeInfo;
}
