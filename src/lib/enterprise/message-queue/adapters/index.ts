/**
 * Adapters — Message Queue Foundation (INF-01).
 */
export {
  DEFAULT_MESSAGE_QUEUE_ADAPTER_ID,
  DEFAULT_MESSAGE_QUEUE_VERSION,
  DefaultMessageQueueAdapter,
  type DefaultMessageQueueRuntime,
} from "./default-message-queue-adapter";

export {
  MOCK_MESSAGE_QUEUE_ADAPTER_ID,
  MOCK_MESSAGE_QUEUE_VERSION,
  MockMessageQueueAdapter,
  type MockMessageQueueAdapterOptions,
} from "./mock-message-queue-adapter";
