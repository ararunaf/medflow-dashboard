/**
 * UploadRuntimeStore — contrato interno do store (F3-CAP-03).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO abre watchers; NÃO captura; NÃO enumera hardware.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalUpload,
  CanonicalUploadReceipt,
  CanonicalUploadSession,
  CanonicalUploadStatistics,
} from "../ports/canonical";

export type StoredCanonicalUpload = CanonicalUpload;
export type StoredCanonicalUploadSession = CanonicalUploadSession;
export type StoredCanonicalUploadReceipt = CanonicalUploadReceipt;

export interface UploadRuntimeStore {
  readonly storeId: string;

  getUpload(uploadId: string): StoredCanonicalUpload | undefined;
  getUploadByName(uploadName: string): StoredCanonicalUpload | undefined;
  setUpload(upload: StoredCanonicalUpload): void;
  removeUpload(uploadId: string): void;
  listUploads(): readonly StoredCanonicalUpload[];

  getSession(sessionId: string): StoredCanonicalUploadSession | undefined;
  setSession(session: StoredCanonicalUploadSession): void;
  listSessions(uploadId?: string): readonly StoredCanonicalUploadSession[];

  getReceipt(receiptId: string): StoredCanonicalUploadReceipt | undefined;
  setReceipt(receipt: StoredCanonicalUploadReceipt): void;
  listReceipts(uploadId?: string): readonly StoredCanonicalUploadReceipt[];

  uploadCount(): number;
  sessionCount(): number;
  receiptCount(): number;
  statistics(): CanonicalUploadStatistics;
  health(): { ok: boolean; message?: string };
}
