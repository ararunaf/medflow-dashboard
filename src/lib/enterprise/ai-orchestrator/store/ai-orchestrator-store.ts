/**
 * AIOrchestratorStore — contrato interno do store (EPC-16).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO executa IA.
 */
import type { AIOrchestrationRequest, AIOrchestrationResult } from "../ports/types";

export type StoredAIOrchestration = {
  request: AIOrchestrationRequest;
  result: AIOrchestrationResult;
};

export interface AIOrchestratorStore {
  readonly storeId: string;

  getSelection(requestId: string): StoredAIOrchestration | undefined;
  setSelection(entry: StoredAIOrchestration): void;
  listSelections(): readonly StoredAIOrchestration[];
  removeSelection(requestId: string): boolean;
  count(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
