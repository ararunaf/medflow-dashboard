/**
 * DocumentClassificationRuntimeStore — contrato interno do store (DIP-04).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa classificação.
 */
import type { CanonicalDocumentClassificationSession } from "../ports/models";

export type StoredDocumentClassificationRuntimeSession = CanonicalDocumentClassificationSession;

export interface DocumentClassificationRuntimeStore {
  readonly storeId: string;

  getSession(runtimeSessionId: string): StoredDocumentClassificationRuntimeSession | undefined;
  setSession(session: StoredDocumentClassificationRuntimeSession): void;
  listSessions(): readonly StoredDocumentClassificationRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
