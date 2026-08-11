/**
 * SupabaseQueueRuntimeBackend — backend persistente oficial (OPER-INF-Q).
 *
 * Infraestrutura nativa de persistência da plataforma (Supabase/Postgres),
 * alinhada a PersistencePort. Sem novo Port. Sem RabbitMQ/Kafka/Redis.
 *
 * Cliente admin deve ser injetado (server-only) — este módulo não importa
 * `@/lib/server/*` para preservar a fronteira client/server.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type {
  CanonicalQueue,
  CanonicalQueueMessage,
  CanonicalQueueStatus,
} from "../ports/canonical";
import type {
  QueueRuntimePersistenceBackend,
  QueueRuntimePersistenceBackendHealth,
} from "./queue-runtime-persistence-backend";

export const SUPABASE_QUEUE_RUNTIME_BACKEND_ID = "supabase-queue-runtime";

const QUEUES_TABLE = "enterprise_queue_runtime_queues";
const MESSAGES_TABLE = "enterprise_queue_runtime_messages";

type QueueRow = {
  queue_id: string;
  queue_name: string;
  message_ids: string[];
  message_count: number;
  identity: CanonicalQueue["identity"] | null;
  metadata: CanonicalQueue["metadata"] | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  message_id: string;
  queue_id: string;
  status: string;
  payload_ref: string | null;
  identity: CanonicalQueueMessage["identity"] | null;
  metadata: CanonicalQueueMessage["metadata"] | null;
  registered_at: string;
  updated_at: string;
};

export type SupabaseQueueRuntimeBackendOptions = {
  /**
   * Cliente Supabase injetável (service role no servidor).
   * Obrigatório para I/O real.
   */
  client?: SupabaseClient | null;
  isConfigured?: () => boolean;
};

function defaultIsConfigured(): boolean {
  return getSupabasePublicConfig() != null;
}

function rowToQueue(row: QueueRow): CanonicalQueue {
  return {
    kind: "canonical-queue",
    queueId: row.queue_id,
    queueName: row.queue_name,
    identity: row.identity ?? {
      kind: "canonical-queue-identity",
      queueId: row.queue_id,
      queueName: row.queue_name,
    },
    metadata: row.metadata ?? undefined,
    messageIds: [...(row.message_ids ?? [])],
    messageCount: row.message_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    realQueueBackend: true,
    messagesPublished: true,
    messagesConsumed: true,
    workersInvoked: false,
    processingPerformed: false,
    persistenceImplemented: true,
  };
}

function queueToRow(queue: CanonicalQueue): QueueRow {
  return {
    queue_id: queue.queueId,
    queue_name: queue.queueName,
    message_ids: [...queue.messageIds],
    message_count: queue.messageCount,
    identity: queue.identity ?? null,
    metadata: queue.metadata ?? null,
    created_at: queue.createdAt,
    updated_at: queue.updatedAt,
  };
}

function rowToMessage(row: MessageRow): CanonicalQueueMessage {
  return {
    kind: "canonical-queue-message",
    messageId: row.message_id,
    queueId: row.queue_id,
    identity: row.identity ?? {
      kind: "canonical-queue-identity",
      queueId: row.queue_id,
      messageId: row.message_id,
    },
    metadata: row.metadata ?? undefined,
    payloadRef: row.payload_ref ?? undefined,
    status: row.status as CanonicalQueueStatus,
    registeredAt: row.registered_at,
    updatedAt: row.updated_at,
    messagesPublished: true,
    messagesConsumed: row.status === "dequeued" || row.status === "acked",
    workersInvoked: false,
    processingPerformed: false,
    persistenceImplemented: true,
    realQueueBackend: true,
  };
}

function messageToRow(message: CanonicalQueueMessage): MessageRow {
  return {
    message_id: message.messageId,
    queue_id: message.queueId,
    status: String(message.status),
    payload_ref: message.payloadRef ?? null,
    identity: message.identity ?? null,
    metadata: message.metadata ?? null,
    registered_at: message.registeredAt,
    updated_at: message.updatedAt,
  };
}

/**
 * Backend Supabase do Queue Runtime — persistência real via Postgres.
 */
export class SupabaseQueueRuntimeBackend implements QueueRuntimePersistenceBackend {
  readonly backendId = SUPABASE_QUEUE_RUNTIME_BACKEND_ID;

  private readonly resolveClient: () => SupabaseClient | null;
  private readonly isConfigured: () => boolean;

  constructor(options: SupabaseQueueRuntimeBackendOptions = {}) {
    this.resolveClient = () => options.client ?? null;
    this.isConfigured = options.isConfigured ?? defaultIsConfigured;
  }

  isReady(): boolean {
    return this.isConfigured() && this.resolveClient() != null;
  }

  async health(): Promise<QueueRuntimePersistenceBackendHealth> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        durable: true,
        message: "Supabase public config ausente para Queue Runtime backend.",
      };
    }
    const client = this.resolveClient();
    if (!client) {
      return {
        ok: false,
        durable: true,
        message:
          "Supabase client ausente para Queue Runtime backend (injete service role no server).",
      };
    }
    return {
      ok: true,
      durable: true,
      message: "Supabase Queue Runtime backend configured (OPER-INF-Q).",
    };
  }

  async persistQueue(queue: CanonicalQueue): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.from(QUEUES_TABLE).upsert(queueToRow(queue), {
      onConflict: "queue_id",
    });
    if (error) {
      throw new Error(`Supabase persistQueue failed: ${error.message}`);
    }
  }

  async persistMessage(message: CanonicalQueueMessage): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.from(MESSAGES_TABLE).upsert(messageToRow(message), {
      onConflict: "message_id",
    });
    if (error) {
      throw new Error(`Supabase persistMessage failed: ${error.message}`);
    }
  }

  async removeMessage(messageId: string): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.from(MESSAGES_TABLE).delete().eq("message_id", messageId);
    if (error) {
      throw new Error(`Supabase removeMessage failed: ${error.message}`);
    }
  }

  async removeMessagesByQueue(queueId: string): Promise<number> {
    const client = this.requireClient();
    const { data, error } = await client
      .from(MESSAGES_TABLE)
      .delete()
      .eq("queue_id", queueId)
      .select("message_id");
    if (error) {
      throw new Error(`Supabase removeMessagesByQueue failed: ${error.message}`);
    }
    return data?.length ?? 0;
  }

  async loadQueues(): Promise<readonly CanonicalQueue[]> {
    const client = this.requireClient();
    const { data, error } = await client.from(QUEUES_TABLE).select("*");
    if (error) {
      throw new Error(`Supabase loadQueues failed: ${error.message}`);
    }
    return ((data ?? []) as QueueRow[]).map(rowToQueue);
  }

  async loadMessages(queueId?: string): Promise<readonly CanonicalQueueMessage[]> {
    const client = this.requireClient();
    let query = client.from(MESSAGES_TABLE).select("*");
    if (queueId) query = query.eq("queue_id", queueId);
    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase loadMessages failed: ${error.message}`);
    }
    return ((data ?? []) as MessageRow[]).map(rowToMessage);
  }

  private requireClient(): SupabaseClient {
    const client = this.resolveClient();
    if (!client) {
      throw new Error("Supabase Queue Runtime backend sem client.");
    }
    return client;
  }
}
