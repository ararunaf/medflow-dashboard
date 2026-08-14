/**
 * ComplianceRuntimeStore — contrato interno do store (S3-02).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa identidade real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  ComplianceFinding,
  ComplianceJob,
  ComplianceRequest,
  ComplianceResult,
  ComplianceStatistics,
} from "../ports/canonical";

export type StoredComplianceRuntimeJob = ComplianceJob;
export type StoredComplianceRuntimeRequest = ComplianceRequest;
export type StoredComplianceRuntimeFinding = ComplianceFinding;
export type StoredComplianceRuntimeResult = ComplianceResult;

export interface ComplianceRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredComplianceRuntimeJob | undefined;
  setJob(job: StoredComplianceRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredComplianceRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredComplianceRuntimeRequest | undefined;
  setRequest(request: StoredComplianceRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredComplianceRuntimeRequest[];
  requestCount(): number;

  getFinding(findingId: string): StoredComplianceRuntimeFinding | undefined;
  setFinding(finding: StoredComplianceRuntimeFinding): void;
  listFindings(jobId?: string): readonly StoredComplianceRuntimeFinding[];
  findingCount(): number;

  getResult(resultId: string): StoredComplianceRuntimeResult | undefined;
  setResult(result: StoredComplianceRuntimeResult): void;
  listResults(): readonly StoredComplianceRuntimeResult[];
  resultCount(): number;

  statistics(): ComplianceStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
