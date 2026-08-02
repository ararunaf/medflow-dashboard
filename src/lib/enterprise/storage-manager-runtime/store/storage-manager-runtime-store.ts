/**
 * StorageManagerRuntimeStore — contrato interno do store (DIP-05).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO armazena arquivos; NÃO faz upload.
 */
import type { CanonicalStorageSession } from "../ports/models";

export type StoredStorageManagerRuntimeSession = CanonicalStorageSession;

export interface StorageManagerRuntimeStore {
  readonly storeId: string;

  getSession(runtimeSessionId: string): StoredStorageManagerRuntimeSession | undefined;
  setSession(session: StoredStorageManagerRuntimeSession): void;
  listSessions(): readonly StoredStorageManagerRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
