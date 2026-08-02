/**
 * InMemoryStorageManagerRuntimeStore — store in-process padrão (DIP-05).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem arquivos físicos, sem upload).
 */
import type {
  StorageManagerRuntimeStore,
  StoredStorageManagerRuntimeSession,
} from "./storage-manager-runtime-store";

export const IN_MEMORY_STORAGE_MANAGER_RUNTIME_STORE_ID = "in-memory";

export type InMemoryStorageManagerRuntimeStoreOptions = {
  sessions?: readonly StoredStorageManagerRuntimeSession[];
};

export class InMemoryStorageManagerRuntimeStore implements StorageManagerRuntimeStore {
  readonly storeId = IN_MEMORY_STORAGE_MANAGER_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredStorageManagerRuntimeSession>();

  constructor(options: InMemoryStorageManagerRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
  }

  getSession(runtimeSessionId: string): StoredStorageManagerRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredStorageManagerRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredStorageManagerRuntimeSession[] {
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
      message: "InMemoryStorageManagerRuntimeStore pronto (sem I/O externo — DIP-05).",
    };
  }
}
