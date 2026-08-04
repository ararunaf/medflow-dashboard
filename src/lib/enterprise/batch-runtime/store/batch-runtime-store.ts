/**
 * BatchRuntimeStore — contrato interno do store (C-06).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO processa lote; NÃO enfileira.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  BatchContext,
  BatchDocument,
  BatchManifest,
  BatchStatistics,
} from "../ports/canonical";

export type StoredBatchManifest = BatchManifest;
export type StoredBatchDocument = BatchDocument;
export type StoredBatchContext = BatchContext;

export interface BatchRuntimeStore {
  readonly storeId: string;

  getManifest(batchId: string): StoredBatchManifest | undefined;
  setManifest(manifest: StoredBatchManifest): void;
  listManifests(): readonly StoredBatchManifest[];
  manifestCount(): number;

  getDocument(documentId: string): StoredBatchDocument | undefined;
  setDocument(document: StoredBatchDocument): void;
  listDocuments(): readonly StoredBatchDocument[];
  documentCount(): number;

  getContext(contextId: string): StoredBatchContext | undefined;
  setContext(context: StoredBatchContext): void;
  listContexts(): readonly StoredBatchContext[];
  contextCount(): number;

  statistics(): BatchStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
