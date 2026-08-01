/**
 * MessageQueueProvider — resolução do ExecutionQueuePort (INF-01).
 *
 * Responsável apenas pela resolução do adapter via Factory.
 * Sem lógica de negócio. Sem workers. Sem backends reais.
 */
import {
  createMessageQueueFactory,
  type MessageQueueFactory,
} from "../factory/message-queue-factory";
import type { ExecutionQueuePort } from "../ports/execution-queue-port";
import type { MessageQueueProviderOptions } from "../ports/types";

/**
 * Provider canônico da fundação Message Queue.
 * Resolve exclusivamente o adapter solicitado.
 */
export class MessageQueueProvider {
  private readonly factory: MessageQueueFactory;

  constructor(factory: MessageQueueFactory = createMessageQueueFactory()) {
    this.factory = factory;
  }

  /** Resolve o ExecutionQueuePort para o provider solicitado. */
  resolve(options: MessageQueueProviderOptions = {}): ExecutionQueuePort {
    return this.factory.create(options);
  }
}

/** Factory helper do MessageQueueProvider. */
export function createMessageQueueProvider(factory?: MessageQueueFactory): MessageQueueProvider {
  return new MessageQueueProvider(factory);
}

/**
 * Provider / factory do ExecutionQueuePort — inversão de dependência (INF-01).
 */
export function createExecutionQueuePort(
  options: MessageQueueProviderOptions = {},
): ExecutionQueuePort {
  return createMessageQueueProvider().resolve(options);
}
