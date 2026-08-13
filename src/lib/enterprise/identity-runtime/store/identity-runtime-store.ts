/**
 * IdentityRuntimeStore — contrato interno do store (S2-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa identidade real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  IdentityFinding,
  IdentityJob,
  IdentityRequest,
  IdentityResult,
  IdentityStatistics,
} from "../ports/canonical";

export type StoredIdentityRuntimeJob = IdentityJob;
export type StoredIdentityRuntimeRequest = IdentityRequest;
export type StoredIdentityRuntimeFinding = IdentityFinding;
export type StoredIdentityRuntimeResult = IdentityResult;

export interface IdentityRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredIdentityRuntimeJob | undefined;
  setJob(job: StoredIdentityRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredIdentityRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredIdentityRuntimeRequest | undefined;
  setRequest(request: StoredIdentityRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredIdentityRuntimeRequest[];
  requestCount(): number;

  getFinding(findingId: string): StoredIdentityRuntimeFinding | undefined;
  setFinding(finding: StoredIdentityRuntimeFinding): void;
  listFindings(jobId?: string): readonly StoredIdentityRuntimeFinding[];
  findingCount(): number;

  getResult(resultId: string): StoredIdentityRuntimeResult | undefined;
  setResult(result: StoredIdentityRuntimeResult): void;
  listResults(): readonly StoredIdentityRuntimeResult[];
  resultCount(): number;

  statistics(): IdentityStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
