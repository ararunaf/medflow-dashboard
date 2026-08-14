/**
 * GovernanceRuntimeStore — contrato interno do store (S6-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa identidade real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  GovernanceFinding,
  GovernanceJob,
  GovernanceRequest,
  GovernanceResult,
  GovernanceStatistics,
} from "../ports/canonical";

export type StoredGovernanceRuntimeJob = GovernanceJob;
export type StoredGovernanceRuntimeRequest = GovernanceRequest;
export type StoredGovernanceRuntimeFinding = GovernanceFinding;
export type StoredGovernanceRuntimeResult = GovernanceResult;

export interface GovernanceRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredGovernanceRuntimeJob | undefined;
  setJob(job: StoredGovernanceRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredGovernanceRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredGovernanceRuntimeRequest | undefined;
  setRequest(request: StoredGovernanceRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredGovernanceRuntimeRequest[];
  requestCount(): number;

  getFinding(findingId: string): StoredGovernanceRuntimeFinding | undefined;
  setFinding(finding: StoredGovernanceRuntimeFinding): void;
  listFindings(jobId?: string): readonly StoredGovernanceRuntimeFinding[];
  findingCount(): number;

  getResult(resultId: string): StoredGovernanceRuntimeResult | undefined;
  setResult(result: StoredGovernanceRuntimeResult): void;
  listResults(): readonly StoredGovernanceRuntimeResult[];
  resultCount(): number;

  statistics(): GovernanceStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
