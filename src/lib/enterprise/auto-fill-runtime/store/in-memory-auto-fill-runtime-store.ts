/**
 * InMemoryAutoFillRuntimeStore — store in-process oficial (F3-CAP-12).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem preenchimento funcional).
 */
import type { AutoFillStatistics } from "../ports/canonical";
import type {
  AutoFillRuntimeStore,
  StoredAutoFillRuntimeResult,
  StoredAutoFillRuntimeSession,
} from "./auto-fill-runtime-store";

export const IN_MEMORY_AUTO_FILL_RUNTIME_STORE_ID = "in-memory-auto-fill-runtime";

export type InMemoryAutoFillRuntimeStoreOptions = {
  sessions?: readonly StoredAutoFillRuntimeSession[];
  results?: readonly StoredAutoFillRuntimeResult[];
};

export class InMemoryAutoFillRuntimeStore implements AutoFillRuntimeStore {
  readonly storeId = IN_MEMORY_AUTO_FILL_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredAutoFillRuntimeSession>();
  private readonly results = new Map<string, StoredAutoFillRuntimeResult>();

  constructor(options: InMemoryAutoFillRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) this.setSession(session);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getSession(autoFillId: string): StoredAutoFillRuntimeSession | undefined {
    const session = this.sessions.get(autoFillId);
    return session ? { ...session } : undefined;
  }

  setSession(session: StoredAutoFillRuntimeSession): void {
    this.sessions.set(session.autoFillId, { ...session });
  }

  removeSession(autoFillId: string): void {
    this.sessions.delete(autoFillId);
  }

  listSessions(): readonly StoredAutoFillRuntimeSession[] {
    return Array.from(this.sessions.values()).map((session) => ({ ...session }));
  }

  sessionCount(): number {
    return this.sessions.size;
  }

  getResult(resultId: string): StoredAutoFillRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredAutoFillRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredAutoFillRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): AutoFillStatistics {
    const sessions = this.listSessions();
    let preparedSessions = 0;
    for (const session of sessions) {
      if (session.status === "prepared") preparedSessions += 1;
    }
    return {
      kind: "canonical-auto-fill-statistics",
      totalSessions: sessions.length,
      preparedSessions,
      totalResults: this.resultCount(),
      totalIssues: 0,
      autoFillEngineImplementedCount: 0,
      guideGenerationImplementedCount: 0,
      fieldPopulationImplementedCount: 0,
      templatePopulationImplementedCount: 0,
      operatorPopulationImplementedCount: 0,
      xmlPopulationImplementedCount: 0,
      validationIntegrationImplementedCount: 0,
      auditIntegrationImplementedCount: 0,
      qualityIntegrationImplementedCount: 0,
      automaticCompletionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Auto-Fill Runtime store ready (${this.sessionCount()} sessions, ${this.resultCount()} results).`,
    };
  }
}
