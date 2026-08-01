/**
 * DocumentProcessorStore — contrato interno do store (EPC-13).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO executa OCR / IA / parsers.
 */
import type { DocumentProcessingResult, ProcessingOutput } from "../ports/types";

export type StoredDocumentProcessing = {
  result: DocumentProcessingResult;
  output?: ProcessingOutput;
};

export interface DocumentProcessorStore {
  readonly storeId: string;

  getProcessing(processingId: string): StoredDocumentProcessing | undefined;
  setProcessing(processing: StoredDocumentProcessing): void;
  listProcessings(): readonly StoredDocumentProcessing[];
  removeProcessing(processingId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
