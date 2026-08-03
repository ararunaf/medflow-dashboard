/**
 * QueueRuntimePort — contrato único do Enterprise Queue Runtime (INF-05).
 *
 * Application / Enterprise Runtime / TISS Runtime dependem exclusivamente
 * desta interface para gerenciar filas canônicas estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → QueueRuntimePort
 *     → Adapter → Queue Runtime Store → Canonical Queue Result
 *
 * INF-05: infraestrutura canônica apenas — sem filas reais / workers / backends.
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
   * Registra estruturalmente uma mensagem no store in-memory.
   * NÃO publica em fila real. NÃO invoca workers.
   */
  enqueue(input: EnqueueInput): Promise<EnqueueResult>;

  /**
   * Obtém estruturalmente a próxima mensagem.
   * NÃO consome de backend real. NÃO processa.
   */
  dequeue(input: DequeueInput): Promise<DequeueResult>;

  /**
   * Observa estruturalmente uma mensagem (sem side-effects de processamento).
   */
  peek(input: PeekInput): Promise<PeekResult>;

  /**
   * Confirma estruturalmente uma mensagem (sem ack real de backend).
   */
  ack(input: AckInput): Promise<AckResult>;

  /**
   * Rejeita estruturalmente uma mensagem (sem nack real de backend).
   */
  nack(input: NackInput): Promise<NackResult>;

  /**
   * Remove estruturalmente mensagens de uma fila canônica (sem purge real).
   */
  purge(input: PurgeInput): Promise<PurgeResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: StatsInput): Promise<StatsResult>;

  /** Verificação leve de prontidão (sem alterar filas). */
  health(): Promise<QueueRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): QueueRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): QueueRuntimeInfo;
}
