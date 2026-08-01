/**
 * Store — Message Queue Foundation (INF-01).
 */
export type {
  MessageQueueStore,
  StoredCanonicalQueue,
  StoredCanonicalQueueMessage,
} from "./message-queue-store";

export {
  IN_MEMORY_MESSAGE_QUEUE_STORE_ID,
  InMemoryMessageQueueStore,
  type InMemoryMessageQueueStoreOptions,
} from "./in-memory-message-queue-store";
