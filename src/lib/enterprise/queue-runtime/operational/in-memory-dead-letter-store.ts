/**
 * InMemoryDeadLetterStore — store isolado de mensagens mortas (OPER-INF-D).
 *
 * Separado do store da fila principal. Sem banco direto. Sem Gateway.
 */
import type { DeadLetterRecord } from "./dead-letter-types";

export const IN_MEMORY_DEAD_LETTER_STORE_ID = "in-memory-dead-letter";

export class InMemoryDeadLetterStore {
  readonly storeId = IN_MEMORY_DEAD_LETTER_STORE_ID;

  private readonly records = new Map<string, DeadLetterRecord>();

  get(deadLetterId: string): DeadLetterRecord | undefined {
    const record = this.records.get(deadLetterId);
    return record ? { ...record, metadata: { ...record.metadata } } : undefined;
  }

  set(record: DeadLetterRecord): void {
    this.records.set(record.deadLetterId, {
      ...record,
      metadata: { ...record.metadata },
    });
  }

  remove(deadLetterId: string): boolean {
    return this.records.delete(deadLetterId);
  }

  clear(): number {
    const count = this.records.size;
    this.records.clear();
    return count;
  }

  list(): readonly DeadLetterRecord[] {
    return Array.from(this.records.values()).map((record) => ({
      ...record,
      metadata: { ...record.metadata },
    }));
  }

  count(): number {
    return this.records.size;
  }
}
