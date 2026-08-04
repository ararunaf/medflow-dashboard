/**
 * DocumentExtractionRuntimeStore — contrato interno do store (F3-CAP-07).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa extração real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  DocumentExtractionDocument,
  DocumentExtractionRequest,
  DocumentExtractionResult,
  ExtractionJob,
  ExtractionStatistics,
} from "../ports/canonical";

export type StoredDocumentExtractionRuntimeJob = ExtractionJob;
export type StoredDocumentExtractionRuntimeRequest = DocumentExtractionRequest;
export type StoredDocumentExtractionRuntimeDocument = DocumentExtractionDocument;
export type StoredDocumentExtractionRuntimeResult = DocumentExtractionResult;

export interface DocumentExtractionRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredDocumentExtractionRuntimeJob | undefined;
  setJob(job: StoredDocumentExtractionRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredDocumentExtractionRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredDocumentExtractionRuntimeRequest | undefined;
  setRequest(request: StoredDocumentExtractionRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredDocumentExtractionRuntimeRequest[];
  requestCount(): number;

  getDocument(documentId: string): StoredDocumentExtractionRuntimeDocument | undefined;
  setDocument(document: StoredDocumentExtractionRuntimeDocument): void;
  listDocuments(jobId?: string): readonly StoredDocumentExtractionRuntimeDocument[];
  documentCount(): number;

  getResult(resultId: string): StoredDocumentExtractionRuntimeResult | undefined;
  setResult(result: StoredDocumentExtractionRuntimeResult): void;
  listResults(): readonly StoredDocumentExtractionRuntimeResult[];
  resultCount(): number;

  statistics(): ExtractionStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
