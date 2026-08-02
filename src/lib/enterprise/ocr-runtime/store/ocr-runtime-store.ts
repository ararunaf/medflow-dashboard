/**
 * OCRRuntimeStore — contrato interno do store (DIP-03).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa OCR.
 */
import type { CanonicalOCRSession } from "../ports/models";

export type StoredOCRRuntimeSession = CanonicalOCRSession;

export interface OCRRuntimeStore {
  readonly storeId: string;

  getSession(runtimeSessionId: string): StoredOCRRuntimeSession | undefined;
  setSession(session: StoredOCRRuntimeSession): void;
  listSessions(): readonly StoredOCRRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
