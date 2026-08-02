/**
 * InMemoryAIProviderRuntimeStore — store in-process padrão (ARCH-02 / DIP-07).
 */
import type {
  AIProviderRuntimeStore,
  StoredAIProviderRuntimeSession,
} from "./ai-provider-runtime-store";

export const IN_MEMORY_AI_PROVIDER_RUNTIME_STORE_ID = "in-memory";

export type InMemoryAIProviderRuntimeStoreOptions = {
  sessions?: readonly StoredAIProviderRuntimeSession[];
};

export class InMemoryAIProviderRuntimeStore implements AIProviderRuntimeStore {
  readonly storeId = IN_MEMORY_AI_PROVIDER_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredAIProviderRuntimeSession>();

  constructor(options: InMemoryAIProviderRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
  }

  getSession(runtimeSessionId: string): StoredAIProviderRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredAIProviderRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredAIProviderRuntimeSession[] {
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
      message: "InMemoryAIProviderRuntimeStore pronto (sem I/O externo — ARCH-02).",
    };
  }
}
