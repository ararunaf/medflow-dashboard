/**
 * QueueRuntimePort — contrato único do Enterprise Queue Runtime (INF-05 / OPER-INF-Q).
 *
 * Application / Enterprise Runtime / TISS Runtime dependem exclusivamente
 * desta interface para gerenciar filas canônicas.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → QueueRuntimePort
 *     → Adapter → Store + Persistence Backend → Canonical Queue Result
 *
 * OPER-INF-Q: backend persistente ativado no adapter — interface pública inalterada.
 */
import type {
  AckInput,
  AckResult,
  DequeueInput,
  DequeueResult,
  EnqueueInput,
  EnqueueResult,
  NackInput,
  NackResult,
  PeekInput,
  PeekResult,
  PurgeInput,
  PurgeResult,
  QueueRuntimeHealth,
  QueueRuntimeInfo,
  QueueRuntimePortCapabilities,
  QueueRuntimeProviderId,
  StatsInput,
  StatsResult,
} from "./types";

export interface QueueRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: QueueRuntimeProviderId;

  /**
   * Registra uma mensagem na fila canônica (persistida pelo backend operacional).
   * NÃO invoca workers.
   */
  enqueue(input: EnqueueInput): Promise<EnqueueResult>;

  /**
   * Obtém a próxima mensagem enfileirada.
   * NÃO processa / NÃO invoca workers.
   */
  dequeue(input: DequeueInput): Promise<DequeueResult>;

  /**
   * Observa uma mensagem (sem side-effects de processamento).
   */
  peek(input: PeekInput): Promise<PeekResult>;

  /**
   * Confirma uma mensagem (ack persistido pelo backend).
   */
  ack(input: AckInput): Promise<AckResult>;

  /**
   * Rejeita uma mensagem (nack persistido pelo backend).
   */
  nack(input: NackInput): Promise<NackResult>;

  /**
   * Remove mensagens de uma fila canônica (purge persistido).
   */
  purge(input: PurgeInput): Promise<PurgeResult>;

  /**
   * Estatísticas do store + backend operacional.
   */
  stats(input?: StatsInput): Promise<StatsResult>;

  /** Verificação leve de prontidão (sem alterar filas). */
  health(): Promise<QueueRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): QueueRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): QueueRuntimeInfo;
}
