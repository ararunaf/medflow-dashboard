/**
 * DefaultDocumentIdentityStore — store in-process padrão (EPC-08).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type { DocumentIdentityStore, StoredDocumentIdentity } from "./document-identity-store";

export const DEFAULT_DOCUMENT_IDENTITY_STORE_ID = "default-in-process";

export type DefaultDocumentIdentityStoreOptions = {
  documents?: readonly StoredDocumentIdentity[];
};

export class DefaultDocumentIdentityStore implements DocumentIdentityStore {
  readonly storeId = DEFAULT_DOCUMENT_IDENTITY_STORE_ID;

  private readonly documents = new Map<string, StoredDocumentIdentity>();

  constructor(options: DefaultDocumentIdentityStoreOptions = {}) {
    for (const document of options.documents ?? []) {
      this.documents.set(document.documentId, document);
    }
  }

  getDocument(documentId: string): StoredDocumentIdentity | undefined {
    return this.documents.get(documentId);
  }

  setDocument(document: StoredDocumentIdentity): void {
    this.documents.set(document.documentId, document);
  }

  listDocuments(): readonly StoredDocumentIdentity[] {
    return [...this.documents.values()];
  }

  removeDocument(documentId: string): boolean {
    return this.documents.delete(documentId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultDocumentIdentityStore ready (${this.documents.size} documents).`,
    };
  }
}
