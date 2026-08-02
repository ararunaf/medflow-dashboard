/**
 * DocumentIntakeRuntimeStore — contrato interno do store (DIP-01).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO conhece OCR/IA/TISS.
 */
import type { CanonicalDocumentIntakeSession } from "../ports/models";

export type StoredDocumentIntakeRuntimeSession = CanonicalDocumentIntakeSession;

export interface DocumentIntakeRuntimeStore {
  readonly storeId: string;

  getSession(runtimeSessionId: string): StoredDocumentIntakeRuntimeSession | undefined;
  setSession(session: StoredDocumentIntakeRuntimeSession): void;
  listSessions(): readonly StoredDocumentIntakeRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
