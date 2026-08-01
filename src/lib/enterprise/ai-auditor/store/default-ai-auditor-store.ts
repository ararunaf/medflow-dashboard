/**
 * DefaultAIAuditorStore — store in-process padrão (EPC-18).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type { AIAuditorStore, StoredAuditExplanation } from "./ai-auditor-store";

export const DEFAULT_AI_AUDITOR_STORE_ID = "default-in-process";

export type DefaultAIAuditorStoreOptions = {
  explanations?: readonly StoredAuditExplanation[];
};

export class DefaultAIAuditorStore implements AIAuditorStore {
  readonly storeId = DEFAULT_AI_AUDITOR_STORE_ID;

  private readonly explanations = new Map<string, StoredAuditExplanation>();

  constructor(options: DefaultAIAuditorStoreOptions = {}) {
    for (const entry of options.explanations ?? []) {
      this.explanations.set(entry.explanation.auditId, entry);
    }
  }

  getExplanation(auditId: string): StoredAuditExplanation | undefined {
    return this.explanations.get(auditId);
  }

  setExplanation(entry: StoredAuditExplanation): void {
    this.explanations.set(entry.explanation.auditId, entry);
  }

  listExplanations(): readonly StoredAuditExplanation[] {
    return [...this.explanations.values()];
  }

  removeExplanation(auditId: string): boolean {
    return this.explanations.delete(auditId);
  }

  count(): number {
    return this.explanations.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultAIAuditorStore ready (${this.explanations.size} explanations).`,
    };
  }
}
