/**
 * InMemoryCaptureEngineRuntimeStore — store in-process padrão (DIP-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type {
  CaptureEngineRuntimeStore,
  StoredCaptureEngineRuntimeSession,
} from "./capture-engine-runtime-store";

export const IN_MEMORY_CAPTURE_ENGINE_RUNTIME_STORE_ID = "in-memory";

export type InMemoryCaptureEngineRuntimeStoreOptions = {
  sessions?: readonly StoredCaptureEngineRuntimeSession[];
};

export class InMemoryCaptureEngineRuntimeStore implements CaptureEngineRuntimeStore {
  readonly storeId = IN_MEMORY_CAPTURE_ENGINE_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredCaptureEngineRuntimeSession>();

  constructor(options: InMemoryCaptureEngineRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
  }

  getSession(runtimeSessionId: string): StoredCaptureEngineRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredCaptureEngineRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredCaptureEngineRuntimeSession[] {
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
      message: "InMemoryCaptureEngineRuntimeStore pronto (sem I/O externo — DIP-02).",
    };
  }
}
