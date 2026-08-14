/**
 * TenantRuntimeStore — contrato interno do store (S3-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa identidade real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  TenantFinding,
  TenantJob,
  TenantRequest,
  TenantResult,
  TenantStatistics,
} from "../ports/canonical";

export type StoredTenantRuntimeJob = TenantJob;
export type StoredTenantRuntimeRequest = TenantRequest;
export type StoredTenantRuntimeFinding = TenantFinding;
export type StoredTenantRuntimeResult = TenantResult;

export interface TenantRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredTenantRuntimeJob | undefined;
  setJob(job: StoredTenantRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredTenantRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredTenantRuntimeRequest | undefined;
  setRequest(request: StoredTenantRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredTenantRuntimeRequest[];
  requestCount(): number;

  getFinding(findingId: string): StoredTenantRuntimeFinding | undefined;
  setFinding(finding: StoredTenantRuntimeFinding): void;
  listFindings(jobId?: string): readonly StoredTenantRuntimeFinding[];
  findingCount(): number;

  getResult(resultId: string): StoredTenantRuntimeResult | undefined;
  setResult(result: StoredTenantRuntimeResult): void;
  listResults(): readonly StoredTenantRuntimeResult[];
  resultCount(): number;

  statistics(): TenantStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
