/**
 * OCRRuntimeStore — contrato interno do store (F3-CAP-05 + DIP-03 preservado).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa OCR real.
 * Sessões (DIP-03) e jobs/requests/documents/results (F3-CAP-05) convivem no
 * mesmo store — acesso exclusivo via Adapter, nunca diretamente pelo produto.
 */
import type { CanonicalOCRSession } from "../ports/models";
import type {
  CanonicalOCRStatistics,
  OCRDocument,
  OCRJob,
  OCRRequest,
  OCRResult,
} from "../ports/canonical";

export type StoredOCRRuntimeSession = CanonicalOCRSession;
export type StoredOCRRuntimeJob = OCRJob;
export type StoredOCRRuntimeRequest = OCRRequest;
export type StoredOCRRuntimeDocument = OCRDocument;
export type StoredOCRRuntimeResult = OCRResult;

export interface OCRRuntimeStore {
  readonly storeId: string;

  // ---------------------------------------------------------------------
  // DIP-03 — sessões de coordenação/execução OCR (preservado).
  // ---------------------------------------------------------------------
  getSession(runtimeSessionId: string): StoredOCRRuntimeSession | undefined;
  setSession(session: StoredOCRRuntimeSession): void;
  listSessions(): readonly StoredOCRRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  // ---------------------------------------------------------------------
  // F3-CAP-05 — jobs / requests / documents / results estruturais.
  // ---------------------------------------------------------------------
  getJob(jobId: string): StoredOCRRuntimeJob | undefined;
  setJob(job: StoredOCRRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredOCRRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredOCRRuntimeRequest | undefined;
  setRequest(request: StoredOCRRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredOCRRuntimeRequest[];
  requestCount(): number;

  getDocument(documentId: string): StoredOCRRuntimeDocument | undefined;
  setDocument(document: StoredOCRRuntimeDocument): void;
  listDocuments(jobId?: string): readonly StoredOCRRuntimeDocument[];
  documentCount(): number;

  getResult(resultId: string): StoredOCRRuntimeResult | undefined;
  setResult(result: StoredOCRRuntimeResult): void;
  listResults(): readonly StoredOCRRuntimeResult[];
  resultCount(): number;

  statistics(): CanonicalOCRStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
