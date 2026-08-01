/**
 * ExecutionContextStore — contrato interno do store (EPC-24 Sprint 03).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO executa OCR / IA / parsers.
 */
import type { ExecutionContext } from "../ports/models";

export type StoredExecutionContext = {
  context: ExecutionContext;
};

export interface ExecutionContextStore {
  readonly storeId: string;

  getContext(contextId: string): StoredExecutionContext | undefined;
  setContext(entry: StoredExecutionContext): void;
  listContexts(): readonly StoredExecutionContext[];
  removeContext(contextId: string): boolean;
  contextCount(): number;

  /** Contadores estruturais agregados. */
  snapshotCount(): number;
  historyCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
