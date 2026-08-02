/**
 * CaptureEngineRuntimeStore — contrato interno do store (DIP-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO conhece OCR/IA/TISS.
 */
import type { CanonicalCaptureSession } from "../ports/models";

export type StoredCaptureEngineRuntimeSession = CanonicalCaptureSession;

export interface CaptureEngineRuntimeStore {
  readonly storeId: string;

  getSession(runtimeSessionId: string): StoredCaptureEngineRuntimeSession | undefined;
  setSession(session: StoredCaptureEngineRuntimeSession): void;
  listSessions(): readonly StoredCaptureEngineRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
