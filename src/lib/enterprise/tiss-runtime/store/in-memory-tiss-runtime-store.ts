/**
 * InMemoryTISSRuntimeStore — store in-process padrão (TISS-01).
 */
import type { StoredTISSRuntimeSession, TISSRuntimeStore } from "./tiss-runtime-store";

export const IN_MEMORY_TISS_RUNTIME_STORE_ID = "in-memory";

export type InMemoryTISSRuntimeStoreOptions = {
  sessions?: readonly StoredTISSRuntimeSession[];
};

export class InMemoryTISSRuntimeStore implements TISSRuntimeStore {
  readonly storeId = IN_MEMORY_TISS_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredTISSRuntimeSession>();

  constructor(options: InMemoryTISSRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
  }

  getSession(runtimeSessionId: string): StoredTISSRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredTISSRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredTISSRuntimeSession[] {
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
      message: "InMemoryTISSRuntimeStore pronto (sem I/O externo — TISS-01).",
    };
  }
}
