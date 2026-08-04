/**
 * AuditRuntimeStore — contrato interno do store (F3-CAP-10).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa auditoria real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  AuditFinding,
  AuditJob,
  AuditRequest,
  AuditResult,
  AuditStatistics,
} from "../ports/canonical";

export type StoredAuditRuntimeJob = AuditJob;
export type StoredAuditRuntimeRequest = AuditRequest;
export type StoredAuditRuntimeFinding = AuditFinding;
export type StoredAuditRuntimeResult = AuditResult;

export interface AuditRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredAuditRuntimeJob | undefined;
  setJob(job: StoredAuditRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredAuditRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredAuditRuntimeRequest | undefined;
  setRequest(request: StoredAuditRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredAuditRuntimeRequest[];
  requestCount(): number;

  getFinding(findingId: string): StoredAuditRuntimeFinding | undefined;
  setFinding(finding: StoredAuditRuntimeFinding): void;
  listFindings(jobId?: string): readonly StoredAuditRuntimeFinding[];
  findingCount(): number;

  getResult(resultId: string): StoredAuditRuntimeResult | undefined;
  setResult(result: StoredAuditRuntimeResult): void;
  listResults(): readonly StoredAuditRuntimeResult[];
  resultCount(): number;

  statistics(): AuditStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
