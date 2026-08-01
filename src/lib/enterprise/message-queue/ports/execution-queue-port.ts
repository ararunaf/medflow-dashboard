/**
 * ExecutionQueuePort — contrato único da infraestrutura canônica de filas (INF-01).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente a infraestrutura de filas.
 * NÃO publica mensagens. NÃO consome mensagens. NÃO invoca workers.
 * Nenhuma operação executa lógica real de mensageria.
 */
import type {
  AcknowledgeInput,
  AcknowledgeResult,
  DequeueInput,
  DequeueResult,
  EnqueueInput,
  EnqueueResult,
  ExecutionQueuePortCapabilities,
  ExecutionQueuePortHealth,
  GetQueueInput,
  GetQueueResult,
  GetStatisticsResult,
  MessageQueueProviderId,
  PeekInput,
  PeekResult,
  RejectInput,
  RejectResult,
  RetryInput,
  RetryResult,
} from "./types";

export interface ExecutionQueuePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: MessageQueueProviderId;

  /** Registra estruturalmente uma mensagem no store in-memory (sem publicação real). */
  enqueue(input: EnqueueInput): Promise<EnqueueResult>;

  /** Obtém estruturalmente a próxima mensagem (sem consumo / processamento real). */
  dequeue(input: DequeueInput): Promise<DequeueResult>;

  /** Observa estruturalmente uma mensagem (sem side-effects de processamento). */
  peek(input: PeekInput): Promise<PeekResult>;

  /** Confirma estruturalmente uma mensagem (sem ack real de backend). */
  acknowledge(input: AcknowledgeInput): Promise<AcknowledgeResult>;

  /** Rejeita estruturalmente uma mensagem (sem reject real de backend). */
  reject(input: RejectInput): Promise<RejectResult>;

  /** Marca estruturalmente retry (sem reprocessamento real). */
  retry(input: RetryInput): Promise<RetryResult>;

  /** Obtém / cria estruturalmente uma fila canônica. */
  getQueue(input: GetQueueInput): Promise<GetQueueResult>;

  /** Estatísticas estruturais do store in-memory. */
  getStatistics(): Promise<GetStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar filas). */
  health(): Promise<ExecutionQueuePortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionQueuePortCapabilities;
}
