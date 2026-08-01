/**
 * ExecutionEventBusPort — contrato único do Barramento Canônico de Eventos (EPC-24 Sprint 05).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente o fluxo de eventos de uma execução.
 * NÃO entrega eventos. NÃO executa subscribers / callbacks.
 * NÃO cria filas. NÃO usa Pub/Sub, EventEmitter ou Workers.
 * Nenhuma Engine é invocada.
 */
import type {
  CreateEventBusInput,
  CreateEventBusResult,
  ExecutionEventBusHealth,
  ExecutionEventBusPortCapabilities,
  ExecutionEventBusProviderId,
  ListEventsInput,
  ListEventsResult,
  ListSubscribersInput,
  ListSubscribersResult,
  PublishEventInput,
  PublishEventResult,
  RegisterSubscriberInput,
  RegisterSubscriberResult,
  UnregisterSubscriberInput,
  UnregisterSubscriberResult,
} from "./types";

export interface ExecutionEventBusPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionEventBusProviderId;

  /** Cria um Event Bus estrutural para uma execução. */
  createEventBus(input: CreateEventBusInput): Promise<CreateEventBusResult>;

  /**
   * Publica estruturalmente (armazena envelope).
   * NÃO entrega. NÃO notifica subscribers. NÃO executa callbacks.
   */
  publish(input: PublishEventInput): Promise<PublishEventResult>;

  /**
   * Registra estruturalmente um subscriber descriptor.
   * NÃO aceita nem executa callbacks.
   */
  register(input: RegisterSubscriberInput): Promise<RegisterSubscriberResult>;

  /** Remove estruturalmente um registro de subscriber. */
  unregister(input: UnregisterSubscriberInput): Promise<UnregisterSubscriberResult>;

  /** Lista registros estruturais de subscribers. */
  listSubscribers(input: ListSubscribersInput): Promise<ListSubscribersResult>;

  /** Lista envelopes/eventos estruturalmente armazenados. */
  listEvents(input: ListEventsInput): Promise<ListEventsResult>;

  /** Verificação leve de prontidão (sem alterar o bus). */
  health(): Promise<ExecutionEventBusHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionEventBusPortCapabilities;
}
