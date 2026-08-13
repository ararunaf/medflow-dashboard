/**
 * AuthorizationRuntimeStore — contrato interno do store (S3-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa identidade real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  AuthorizationFinding,
  AuthorizationJob,
  AuthorizationRequest,
  AuthorizationResult,
  AuthorizationStatistics,
} from "../ports/canonical";

export type StoredAuthorizationRuntimeJob = AuthorizationJob;
export type StoredAuthorizationRuntimeRequest = AuthorizationRequest;
export type StoredAuthorizationRuntimeFinding = AuthorizationFinding;
export type StoredAuthorizationRuntimeResult = AuthorizationResult;

export interface AuthorizationRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredAuthorizationRuntimeJob | undefined;
  setJob(job: StoredAuthorizationRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredAuthorizationRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredAuthorizationRuntimeRequest | undefined;
  setRequest(request: StoredAuthorizationRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredAuthorizationRuntimeRequest[];
  requestCount(): number;

  getFinding(findingId: string): StoredAuthorizationRuntimeFinding | undefined;
  setFinding(finding: StoredAuthorizationRuntimeFinding): void;
  listFindings(jobId?: string): readonly StoredAuthorizationRuntimeFinding[];
  findingCount(): number;

  getResult(resultId: string): StoredAuthorizationRuntimeResult | undefined;
  setResult(result: StoredAuthorizationRuntimeResult): void;
  listResults(): readonly StoredAuthorizationRuntimeResult[];
  resultCount(): number;

  statistics(): AuthorizationStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
