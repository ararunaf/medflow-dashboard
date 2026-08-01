/**
 * DefaultDocumentProcessorStore — store in-process padrão (EPC-13).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type { DocumentProcessorStore, StoredDocumentProcessing } from "./document-processor-store";

export const DEFAULT_DOCUMENT_PROCESSOR_STORE_ID = "default-in-process";

export type DefaultDocumentProcessorStoreOptions = {
  processings?: readonly StoredDocumentProcessing[];
};

export class DefaultDocumentProcessorStore implements DocumentProcessorStore {
  readonly storeId = DEFAULT_DOCUMENT_PROCESSOR_STORE_ID;

  private readonly processings = new Map<string, StoredDocumentProcessing>();

  constructor(options: DefaultDocumentProcessorStoreOptions = {}) {
    for (const processing of options.processings ?? []) {
      this.processings.set(processing.result.processingId, processing);
    }
  }

  getProcessing(processingId: string): StoredDocumentProcessing | undefined {
    return this.processings.get(processingId);
  }

  setProcessing(processing: StoredDocumentProcessing): void {
    this.processings.set(processing.result.processingId, processing);
  }

  listProcessings(): readonly StoredDocumentProcessing[] {
    return [...this.processings.values()];
  }

  removeProcessing(processingId: string): boolean {
    return this.processings.delete(processingId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultDocumentProcessorStore ready (${this.processings.size} processings).`,
    };
  }
}
