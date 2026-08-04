/**
 * DocumentClassificationRuntimeStore — contrato interno do store (F3-CAP-06 + DIP-04 preservado).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa classificação real.
 * Sessões (DIP-04) e jobs/requests/documents/results (F3-CAP-06) convivem no
 * mesmo store — acesso exclusivo via Adapter, nunca diretamente pelo produto.
 */
import type { CanonicalDocumentClassificationSession } from "../ports/models";
import type {
  CanonicalClassificationStatistics,
  DocumentClassificationDocument,
  DocumentClassificationJob,
  DocumentClassificationRequest,
  DocumentClassificationResult,
} from "../ports/canonical";

export type StoredDocumentClassificationRuntimeSession = CanonicalDocumentClassificationSession;
export type StoredDocumentClassificationRuntimeJob = DocumentClassificationJob;
export type StoredDocumentClassificationRuntimeRequest = DocumentClassificationRequest;
export type StoredDocumentClassificationRuntimeDocument = DocumentClassificationDocument;
export type StoredDocumentClassificationRuntimeResult = DocumentClassificationResult;

export interface DocumentClassificationRuntimeStore {
  readonly storeId: string;

  // ---------------------------------------------------------------------
  // DIP-04 — sessões de coordenação/execução de classificação (preservado).
  // ---------------------------------------------------------------------
  getSession(runtimeSessionId: string): StoredDocumentClassificationRuntimeSession | undefined;
  setSession(session: StoredDocumentClassificationRuntimeSession): void;
  listSessions(): readonly StoredDocumentClassificationRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  // ---------------------------------------------------------------------
  // F3-CAP-06 — jobs / requests / documents / results estruturais.
  // ---------------------------------------------------------------------
  getJob(jobId: string): StoredDocumentClassificationRuntimeJob | undefined;
  setJob(job: StoredDocumentClassificationRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredDocumentClassificationRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredDocumentClassificationRuntimeRequest | undefined;
  setRequest(request: StoredDocumentClassificationRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredDocumentClassificationRuntimeRequest[];
  requestCount(): number;

  getDocument(documentId: string): StoredDocumentClassificationRuntimeDocument | undefined;
  setDocument(document: StoredDocumentClassificationRuntimeDocument): void;
  listDocuments(jobId?: string): readonly StoredDocumentClassificationRuntimeDocument[];
  documentCount(): number;

  getResult(resultId: string): StoredDocumentClassificationRuntimeResult | undefined;
  setResult(result: StoredDocumentClassificationRuntimeResult): void;
  listResults(): readonly StoredDocumentClassificationRuntimeResult[];
  resultCount(): number;

  statistics(): CanonicalClassificationStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
