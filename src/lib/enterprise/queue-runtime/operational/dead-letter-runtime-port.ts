/**
 * DeadLetterRuntimePort — contrato INTERNO operacional (OPER-INF-D).
 *
 * NÃO é Port Enterprise novo. NÃO é Gateway. NÃO é Runtime paralelo.
 * Consumido exclusivamente por DefaultQueueRuntimeAdapter (QueueRuntimePort).
 * Depende exclusivamente de QueueRuntimePort para isolamento da fila principal.
 *
 * Responsabilidade única: armazenar definitivamente mensagens de falha permanente.
 * Sem retry. Sem reprocessamento. Sem scheduler. Sem worker.
 */
import type {
  DeadLetterGetByIdInput,
  DeadLetterGetByIdResult,
  DeadLetterParkInput,
  DeadLetterParkResult,
  DeadLetterPurgeInput,
  DeadLetterPurgeResult,
  DeadLetterStatsResult,
} from "./dead-letter-types";

export interface DeadLetterRuntimePort {
  /**
   * Armazena definitivamente uma mensagem classificada como falha permanente.
   * Isola da fila principal via QueueRuntimePort (fila enterprise-dead-letter).
   */
  park(input: DeadLetterParkInput): Promise<DeadLetterParkResult>;

  /** Consulta registro morto por id. */
  getById(input: DeadLetterGetByIdInput): Promise<DeadLetterGetByIdResult>;

  /** Purge de um registro ou de toda a Dead Letter Queue. */
  purge(input?: DeadLetterPurgeInput): Promise<DeadLetterPurgeResult>;

  /** Contagem estrutural de mensagens mortas. */
  stats(): Promise<DeadLetterStatsResult>;
}
