/**
 * SecurityRuntimeStore — contrato interno do store (S1-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa segurança real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  SecurityFinding,
  SecurityJob,
  SecurityRequest,
  SecurityResult,
  SecurityStatistics,
} from "../ports/canonical";

export type StoredSecurityRuntimeJob = SecurityJob;
export type StoredSecurityRuntimeRequest = SecurityRequest;
export type StoredSecurityRuntimeFinding = SecurityFinding;
export type StoredSecurityRuntimeResult = SecurityResult;

export interface SecurityRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredSecurityRuntimeJob | undefined;
  setJob(job: StoredSecurityRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredSecurityRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredSecurityRuntimeRequest | undefined;
  setRequest(request: StoredSecurityRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredSecurityRuntimeRequest[];
  requestCount(): number;

  getFinding(findingId: string): StoredSecurityRuntimeFinding | undefined;
  setFinding(finding: StoredSecurityRuntimeFinding): void;
  listFindings(jobId?: string): readonly StoredSecurityRuntimeFinding[];
  findingCount(): number;

  getResult(resultId: string): StoredSecurityRuntimeResult | undefined;
  setResult(result: StoredSecurityRuntimeResult): void;
  listResults(): readonly StoredSecurityRuntimeResult[];
  resultCount(): number;

  statistics(): SecurityStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
