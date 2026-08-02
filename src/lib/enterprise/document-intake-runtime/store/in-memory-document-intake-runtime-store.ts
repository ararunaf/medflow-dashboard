/**
 * InMemoryDocumentIntakeRuntimeStore — store in-process padrão (DIP-01).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type {
  DocumentIntakeRuntimeStore,
  StoredDocumentIntakeRuntimeSession,
} from "./document-intake-runtime-store";

export const IN_MEMORY_DOCUMENT_INTAKE_RUNTIME_STORE_ID = "in-memory";

export type InMemoryDocumentIntakeRuntimeStoreOptions = {
  sessions?: readonly StoredDocumentIntakeRuntimeSession[];
};

export class InMemoryDocumentIntakeRuntimeStore implements DocumentIntakeRuntimeStore {
  readonly storeId = IN_MEMORY_DOCUMENT_INTAKE_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredDocumentIntakeRuntimeSession>();

  constructor(options: InMemoryDocumentIntakeRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
  }

  getSession(runtimeSessionId: string): StoredDocumentIntakeRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredDocumentIntakeRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredDocumentIntakeRuntimeSession[] {
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
      message: "InMemoryDocumentIntakeRuntimeStore pronto (sem I/O externo — DIP-01).",
    };
  }
}
