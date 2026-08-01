/**
 * DefaultAIOrchestratorStore — store in-process padrão (EPC-16).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type { AIOrchestratorStore, StoredAIOrchestration } from "./ai-orchestrator-store";

export const DEFAULT_AI_ORCHESTRATOR_STORE_ID = "default-in-process";

export type DefaultAIOrchestratorStoreOptions = {
  selections?: readonly StoredAIOrchestration[];
};

export class DefaultAIOrchestratorStore implements AIOrchestratorStore {
  readonly storeId = DEFAULT_AI_ORCHESTRATOR_STORE_ID;

  private readonly selections = new Map<string, StoredAIOrchestration>();

  constructor(options: DefaultAIOrchestratorStoreOptions = {}) {
    for (const entry of options.selections ?? []) {
      this.selections.set(entry.result.requestId, entry);
    }
  }

  getSelection(requestId: string): StoredAIOrchestration | undefined {
    return this.selections.get(requestId);
  }

  setSelection(entry: StoredAIOrchestration): void {
    this.selections.set(entry.result.requestId, entry);
  }

  listSelections(): readonly StoredAIOrchestration[] {
    return [...this.selections.values()];
  }

  removeSelection(requestId: string): boolean {
    return this.selections.delete(requestId);
  }

  count(): number {
    return this.selections.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultAIOrchestratorStore ready (${this.selections.size} selections).`,
    };
  }
}
