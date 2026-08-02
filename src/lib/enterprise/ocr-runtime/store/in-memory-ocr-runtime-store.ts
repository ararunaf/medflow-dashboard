/**
 * InMemoryOCRRuntimeStore — store in-process padrão (DIP-03).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type { OCRRuntimeStore, StoredOCRRuntimeSession } from "./ocr-runtime-store";

export const IN_MEMORY_OCR_RUNTIME_STORE_ID = "in-memory";

export type InMemoryOCRRuntimeStoreOptions = {
  sessions?: readonly StoredOCRRuntimeSession[];
};

export class InMemoryOCRRuntimeStore implements OCRRuntimeStore {
  readonly storeId = IN_MEMORY_OCR_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredOCRRuntimeSession>();

  constructor(options: InMemoryOCRRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
  }

  getSession(runtimeSessionId: string): StoredOCRRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredOCRRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredOCRRuntimeSession[] {
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
      message: "InMemoryOCRRuntimeStore pronto (sem I/O externo — DIP-03).",
    };
  }
}
