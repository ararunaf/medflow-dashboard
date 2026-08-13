/**
 * CompletedRuntimeStore — contrato interno do store (A10-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa completedoria real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CompletedFinding,
  CompletedJob,
  CompletedRequest,
  CompletedResult,
  CompletedStatistics,
} from "../ports/canonical";

export type StoredCompletedRuntimeJob = CompletedJob;
export type StoredCompletedRuntimeRequest = CompletedRequest;
export type StoredCompletedRuntimeFinding = CompletedFinding;
export type StoredCompletedRuntimeResult = CompletedResult;

export interface CompletedRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredCompletedRuntimeJob | undefined;
  setJob(job: StoredCompletedRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredCompletedRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredCompletedRuntimeRequest | undefined;
  setRequest(request: StoredCompletedRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredCompletedRuntimeRequest[];
  requestCount(): number;

  getFinding(findingId: string): StoredCompletedRuntimeFinding | undefined;
  setFinding(finding: StoredCompletedRuntimeFinding): void;
  listFindings(jobId?: string): readonly StoredCompletedRuntimeFinding[];
  findingCount(): number;

  getResult(resultId: string): StoredCompletedRuntimeResult | undefined;
  setResult(result: StoredCompletedRuntimeResult): void;
  listResults(): readonly StoredCompletedRuntimeResult[];
  resultCount(): number;

  statistics(): CompletedStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
