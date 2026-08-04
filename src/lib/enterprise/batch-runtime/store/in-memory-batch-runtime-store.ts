/**
 * InMemoryBatchRuntimeStore — store in-process oficial (C-06).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem processamento em lote, sem filas, sem workers).
 */
import type { BatchStatistics } from "../ports/canonical";
import type {
  BatchRuntimeStore,
  StoredBatchContext,
  StoredBatchDocument,
  StoredBatchManifest,
} from "./batch-runtime-store";

export const IN_MEMORY_BATCH_RUNTIME_STORE_ID = "in-memory-batch-runtime";

export type InMemoryBatchRuntimeStoreOptions = {
  manifests?: readonly StoredBatchManifest[];
  documents?: readonly StoredBatchDocument[];
  contexts?: readonly StoredBatchContext[];
};

export class InMemoryBatchRuntimeStore implements BatchRuntimeStore {
  readonly storeId = IN_MEMORY_BATCH_RUNTIME_STORE_ID;

  private readonly manifests = new Map<string, StoredBatchManifest>();
  private readonly documents = new Map<string, StoredBatchDocument>();
  private readonly contexts = new Map<string, StoredBatchContext>();

  constructor(options: InMemoryBatchRuntimeStoreOptions = {}) {
    for (const manifest of options.manifests ?? []) this.setManifest(manifest);
    for (const document of options.documents ?? []) this.setDocument(document);
    for (const context of options.contexts ?? []) this.setContext(context);
  }

  getManifest(batchId: string): StoredBatchManifest | undefined {
    const manifest = this.manifests.get(batchId);
    return manifest ? { ...manifest } : undefined;
  }

  setManifest(manifest: StoredBatchManifest): void {
    const key = manifest.batchId ?? `batch-${this.manifests.size + 1}`;
    this.manifests.set(key, { ...manifest, batchId: key });
  }

  listManifests(): readonly StoredBatchManifest[] {
    return Array.from(this.manifests.values()).map((manifest) => ({ ...manifest }));
  }

  manifestCount(): number {
    return this.manifests.size;
  }

  getDocument(documentId: string): StoredBatchDocument | undefined {
    const document = this.documents.get(documentId);
    return document ? { ...document } : undefined;
  }

  setDocument(document: StoredBatchDocument): void {
    const key = document.documentId ?? `doc-${this.documents.size + 1}`;
    this.documents.set(key, { ...document, documentId: key });
  }

  listDocuments(): readonly StoredBatchDocument[] {
    return Array.from(this.documents.values()).map((document) => ({ ...document }));
  }

  documentCount(): number {
    return this.documents.size;
  }

  getContext(contextId: string): StoredBatchContext | undefined {
    const context = this.contexts.get(contextId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredBatchContext): void {
    const key = context.contextId ?? context.batchId ?? `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredBatchContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  statistics(): BatchStatistics {
    const all = this.listManifests();
    let created = 0;
    let validated = 0;
    let queued = 0;
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    for (const manifest of all) {
      if (manifest.state === "CREATED") created += 1;
      if (manifest.state === "VALIDATED") validated += 1;
      if (manifest.state === "QUEUED") queued += 1;
      if (manifest.state === "COMPLETED") completed += 1;
      if (manifest.state === "FAILED") failed += 1;
      if (manifest.state === "CANCELLED") cancelled += 1;
    }
    return {
      kind: "canonical-batch-statistics",
      totalManifests: all.length,
      totalDocuments: this.documentCount(),
      totalContexts: this.contextCount(),
      createdCount: created,
      validatedCount: validated,
      queuedCount: queued,
      completedCount: completed,
      failedCount: failed,
      cancelledCount: cancelled,
      batchProcessedCount: 0,
      batchProcessingImplementedCount: 0,
      parallelExecutionImplementedCount: 0,
      retryImplementedCount: 0,
      schedulerImplementedCount: 0,
      workerImplementedCount: 0,
      queueImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Batch Runtime store ready (${this.manifestCount()} manifests, ${this.documentCount()} documents, ${this.contextCount()} contexts).`,
    };
  }
}
