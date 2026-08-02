/**
 * InMemoryDocumentClassificationRuntimeStore — store in-process padrão (DIP-04).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type {
  DocumentClassificationRuntimeStore,
  StoredDocumentClassificationRuntimeSession,
} from "./document-classification-runtime-store";

export const IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID = "in-memory";

export type InMemoryDocumentClassificationRuntimeStoreOptions = {
  sessions?: readonly StoredDocumentClassificationRuntimeSession[];
};

export class InMemoryDocumentClassificationRuntimeStore implements DocumentClassificationRuntimeStore {
  readonly storeId = IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredDocumentClassificationRuntimeSession>();

  constructor(options: InMemoryDocumentClassificationRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
  }

  getSession(runtimeSessionId: string): StoredDocumentClassificationRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredDocumentClassificationRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredDocumentClassificationRuntimeSession[] {
    return [...this.sessions.values()];
  }

  removeSession(runtimeSessionId: string): boolean {
    return this.sessions.delete(runtimeSessionId);
  }

  sessionCount(): number {
    return this.sessions.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: "InMemoryDocumentClassificationRuntimeStore pronto (sem I/O externo — DIP-04).",
    };
  }
}
