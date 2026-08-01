/**
 * DocumentIdentityStore — contrato interno do store (EPC-08).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO armazena blobs.
 */
import type { DocumentIdentity } from "../ports/types";

export type StoredDocumentIdentity = DocumentIdentity;

export interface DocumentIdentityStore {
  readonly storeId: string;

  getDocument(documentId: string): StoredDocumentIdentity | undefined;
  setDocument(document: StoredDocumentIdentity): void;
  listDocuments(): readonly StoredDocumentIdentity[];
  removeDocument(documentId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
