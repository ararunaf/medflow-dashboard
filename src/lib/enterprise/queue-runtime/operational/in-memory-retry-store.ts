/**
 * InMemoryRetryStore — store isolado de decisões de retry (OPER-INF-R).
 *
 * Separado do store da fila principal. Sem banco direto. Sem Gateway.
 */
import type { RetryRecord } from "./retry-types";

export const IN_MEMORY_RETRY_STORE_ID = "in-memory-retry";

export class InMemoryRetryStore {
  readonly storeId = IN_MEMORY_RETRY_STORE_ID;

  private readonly records = new Map<string, RetryRecord>();

  get(retryId: string): RetryRecord | undefined {
    const record = this.records.get(retryId);
    return record ? { ...record, metadata: { ...record.metadata } } : undefined;
  }

  set(record: RetryRecord): void {
    this.records.set(record.retryId, {
      ...record,
      metadata: { ...record.metadata },
    });
  }

  remove(retryId: string): boolean {
    return this.records.delete(retryId);
  }

  clear(): number {
    const count = this.records.size;
    this.records.clear();
    return count;
  }

  list(): readonly RetryRecord[] {
    return Array.from(this.records.values()).map((record) => ({
      ...record,
      metadata: { ...record.metadata },
    }));
  }

  count(): number {
    return this.records.size;
  }

  countByStatus(status: RetryRecord["status"]): number {
    let n = 0;
    for (const record of this.records.values()) {
      if (record.status === status) n += 1;
    }
    return n;
  }
}
