/**
 * DocumentSearchRuntimeStore — contrato interno do store (DIP-06).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO indexa; NÃO busca documentos.
 */
import type { CanonicalSearchSession } from "../ports/models";

export type StoredDocumentSearchRuntimeSession = CanonicalSearchSession;

export interface DocumentSearchRuntimeStore {
  readonly storeId: string;

  getSession(runtimeSessionId: string): StoredDocumentSearchRuntimeSession | undefined;
  setSession(session: StoredDocumentSearchRuntimeSession): void;
  listSessions(): readonly StoredDocumentSearchRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
