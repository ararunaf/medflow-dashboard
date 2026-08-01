/**
 * MessageQueueFactory — instancia o adapter correto (INF-01).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem workers. Sem publicação. Sem consumo. Sem backends reais de fila.
 * Posição na arquitetura:
 *   Application → ExecutionQueuePort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultMessageQueueAdapter, MockMessageQueueAdapter } from "../adapters";
import type { ExecutionQueuePort } from "../ports/execution-queue-port";
import type { MessageQueueProviderId, MessageQueueProviderOptions } from "../ports/types";
import type { MessageQueueStore } from "../store";

export type MessageQueueFactoryOptions = {
  defaultProvider?: MessageQueueProviderId;
  store?: MessageQueueStore;
};

export class MessageQueueFactory {
  private readonly defaultProvider: MessageQueueProviderId;
  private readonly store?: MessageQueueStore;

  constructor(options: MessageQueueFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(options: MessageQueueProviderOptions = {}): ExecutionQueuePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: MessageQueueProviderId): ExecutionQueuePort {
    switch (provider) {
      case "default":
        return new DefaultMessageQueueAdapter({ store: this.store });
      case "mock":
        return new MockMessageQueueAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockMessageQueueAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de message-queue desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createMessageQueueFactory(
  options: MessageQueueFactoryOptions = {},
): MessageQueueFactory {
  return new MessageQueueFactory(options);
}
