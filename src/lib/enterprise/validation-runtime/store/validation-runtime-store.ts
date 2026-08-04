/**
 * ValidationRuntimeStore — contrato interno do store (F3-CAP-08).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa validação real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  ValidationDocument,
  ValidationJob,
  ValidationRequest,
  ValidationResult,
  ValidationStatistics,
} from "../ports/canonical";

export type StoredValidationRuntimeJob = ValidationJob;
export type StoredValidationRuntimeRequest = ValidationRequest;
export type StoredValidationRuntimeDocument = ValidationDocument;
export type StoredValidationRuntimeResult = ValidationResult;

export interface ValidationRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredValidationRuntimeJob | undefined;
  setJob(job: StoredValidationRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredValidationRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredValidationRuntimeRequest | undefined;
  setRequest(request: StoredValidationRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredValidationRuntimeRequest[];
  requestCount(): number;

  getDocument(documentId: string): StoredValidationRuntimeDocument | undefined;
  setDocument(document: StoredValidationRuntimeDocument): void;
  listDocuments(jobId?: string): readonly StoredValidationRuntimeDocument[];
  documentCount(): number;

  getResult(resultId: string): StoredValidationRuntimeResult | undefined;
  setResult(result: StoredValidationRuntimeResult): void;
  listResults(): readonly StoredValidationRuntimeResult[];
  resultCount(): number;

  statistics(): ValidationStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
