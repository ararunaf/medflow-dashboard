/**
 * AutoFillRuntimeStore — contrato interno do store (F3-CAP-12).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa preenchimento funcional.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { AutoFillResult, AutoFillSession, AutoFillStatistics } from "../ports/canonical";

export type StoredAutoFillRuntimeSession = AutoFillSession;
export type StoredAutoFillRuntimeResult = AutoFillResult;

export interface AutoFillRuntimeStore {
  readonly storeId: string;

  getSession(autoFillId: string): StoredAutoFillRuntimeSession | undefined;
  setSession(session: StoredAutoFillRuntimeSession): void;
  removeSession(autoFillId: string): void;
  listSessions(): readonly StoredAutoFillRuntimeSession[];
  sessionCount(): number;

  getResult(resultId: string): StoredAutoFillRuntimeResult | undefined;
  setResult(result: StoredAutoFillRuntimeResult): void;
  listResults(): readonly StoredAutoFillRuntimeResult[];
  resultCount(): number;

  statistics(): AutoFillStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
