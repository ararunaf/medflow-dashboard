/**
 * InMemoryUploadRuntimeStore — store in-process (F3-CAP-03).
 *
 * Implementação oficial do Upload Runtime Store.
 * Sem banco. Sem watchers. Sem Upload Web/Desktop/Mobile/API real. Sem storage providers. Sem Scanner real.
 */
import type { CanonicalUploadStatistics } from "../ports/canonical";
import type {
  StoredCanonicalUpload,
  StoredCanonicalUploadReceipt,
  StoredCanonicalUploadSession,
  UploadRuntimeStore,
} from "./upload-runtime-store";

export const IN_MEMORY_UPLOAD_RUNTIME_STORE_ID = "in-memory-upload-runtime";

export type InMemoryUploadRuntimeStoreOptions = {
  uploads?: readonly StoredCanonicalUpload[];
  sessions?: readonly StoredCanonicalUploadSession[];
  receipts?: readonly StoredCanonicalUploadReceipt[];
};

/**
 * Store de Uploads/sessões/receipts canônicos in-memory — exclusivo do Adapter (F3-CAP-03).
 */
export class InMemoryUploadRuntimeStore implements UploadRuntimeStore {
  readonly storeId = IN_MEMORY_UPLOAD_RUNTIME_STORE_ID;

  private readonly uploads = new Map<string, StoredCanonicalUpload>();
  private readonly byName = new Map<string, string>();
  private readonly sessions = new Map<string, StoredCanonicalUploadSession>();
  private readonly receipts = new Map<string, StoredCanonicalUploadReceipt>();

  constructor(options: InMemoryUploadRuntimeStoreOptions = {}) {
    for (const upload of options.uploads ?? []) {
      this.setUpload(upload);
    }
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
    for (const receipt of options.receipts ?? []) {
      this.setReceipt(receipt);
    }
  }

  getUpload(uploadId: string): StoredCanonicalUpload | undefined {
    const upload = this.uploads.get(uploadId);
    return upload ? { ...upload } : undefined;
  }

  getUploadByName(uploadName: string): StoredCanonicalUpload | undefined {
    const uploadId = this.byName.get(uploadName);
    if (!uploadId) return undefined;
    return this.getUpload(uploadId);
  }

  setUpload(upload: StoredCanonicalUpload): void {
    this.uploads.set(upload.uploadId, { ...upload });
    this.byName.set(upload.uploadName, upload.uploadId);
  }

  removeUpload(uploadId: string): void {
    const existing = this.uploads.get(uploadId);
    if (existing) {
      this.byName.delete(existing.uploadName);
      this.uploads.delete(uploadId);
    }
  }

  listUploads(): readonly StoredCanonicalUpload[] {
    return Array.from(this.uploads.values()).map((upload) => ({ ...upload }));
  }

  getSession(sessionId: string): StoredCanonicalUploadSession | undefined {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : undefined;
  }

  setSession(session: StoredCanonicalUploadSession): void {
    this.sessions.set(session.sessionId, { ...session });
  }

  listSessions(uploadId?: string): readonly StoredCanonicalUploadSession[] {
    const all = Array.from(this.sessions.values()).map((session) => ({ ...session }));
    if (!uploadId) return all;
    return all.filter((session) => session.uploadId === uploadId);
  }

  getReceipt(receiptId: string): StoredCanonicalUploadReceipt | undefined {
    const receipt = this.receipts.get(receiptId);
    return receipt ? { ...receipt } : undefined;
  }

  setReceipt(receipt: StoredCanonicalUploadReceipt): void {
    this.receipts.set(receipt.receiptId, { ...receipt });
  }

  listReceipts(uploadId?: string): readonly StoredCanonicalUploadReceipt[] {
    const all = Array.from(this.receipts.values()).map((receipt) => ({
      ...receipt,
    }));
    if (!uploadId) return all;
    return all.filter((receipt) => receipt.uploadId === uploadId);
  }

  uploadCount(): number {
    return this.uploads.size;
  }

  sessionCount(): number {
    return this.sessions.size;
  }

  receiptCount(): number {
    return this.receipts.size;
  }

  statistics(): CanonicalUploadStatistics {
    const all = this.listUploads();
    let registered = 0;
    let discovered = 0;
    for (const upload of all) {
      if (upload.status === "registered") registered += 1;
      if (upload.discovered || upload.status === "discovered") discovered += 1;
    }
    const sessions = this.listSessions();
    let openSessions = 0;
    let closedSessions = 0;
    for (const session of sessions) {
      if (session.status === "session-open") openSessions += 1;
      if (session.status === "session-closed") closedSessions += 1;
    }
    return {
      kind: "canonical-upload-statistics",
      totalUploads: all.length,
      registeredUploads: registered,
      discoveredUploads: discovered,
      openSessions,
      closedSessions,
      totalReceipts: this.receiptCount(),
      webUploadImplementedCount: 0,
      desktopUploadImplementedCount: 0,
      mobileUploadImplementedCount: 0,
      apiUploadImplementedCount: 0,
      multipartImplementedCount: 0,
      chunkedUploadImplementedCount: 0,
      resumableUploadImplementedCount: 0,
      azureBlobImplementedCount: 0,
      supabaseStorageImplementedCount: 0,
      s3ImplementedCount: 0,
      googleDriveImplementedCount: 0,
      oneDriveImplementedCount: 0,
      dropboxImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Upload Runtime store ready (${this.uploadCount()} uploads, ${this.sessionCount()} sessions, ${this.receiptCount()} receipts).`,
    };
  }
}
