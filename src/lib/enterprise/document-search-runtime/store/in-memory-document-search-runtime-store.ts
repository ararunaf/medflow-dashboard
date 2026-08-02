/**
 * InMemoryDocumentSearchRuntimeStore — store in-process padrão (DIP-06).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem indexação, sem busca real).
 */
import type {
  DocumentSearchRuntimeStore,
  StoredDocumentSearchRuntimeSession,
} from "./document-search-runtime-store";

export const IN_MEMORY_DOCUMENT_SEARCH_RUNTIME_STORE_ID = "in-memory";

export type InMemoryDocumentSearchRuntimeStoreOptions = {
  sessions?: readonly StoredDocumentSearchRuntimeSession[];
};

export class InMemoryDocumentSearchRuntimeStore implements DocumentSearchRuntimeStore {
  readonly storeId = IN_MEMORY_DOCUMENT_SEARCH_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredDocumentSearchRuntimeSession>();

  constructor(options: InMemoryDocumentSearchRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
  }

  getSession(runtimeSessionId: string): StoredDocumentSearchRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredDocumentSearchRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredDocumentSearchRuntimeSession[] {
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
      message: "InMemoryDocumentSearchRuntimeStore pronto (sem I/O externo — DIP-06).",
    };
  }
}
