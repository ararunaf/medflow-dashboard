/**
 * InMemoryAuditRuntimeStore — store in-process oficial (F3-CAP-10).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem auditoria real).
 */
import type { AuditStatistics } from "../ports/canonical";
import type {
  AuditRuntimeStore,
  StoredAuditRuntimeFinding,
  StoredAuditRuntimeJob,
  StoredAuditRuntimeRequest,
  StoredAuditRuntimeResult,
} from "./audit-runtime-store";

export const IN_MEMORY_AUDIT_RUNTIME_STORE_ID = "in-memory-audit-runtime";

export type InMemoryAuditRuntimeStoreOptions = {
  jobs?: readonly StoredAuditRuntimeJob[];
  requests?: readonly StoredAuditRuntimeRequest[];
  findings?: readonly StoredAuditRuntimeFinding[];
  results?: readonly StoredAuditRuntimeResult[];
};

export class InMemoryAuditRuntimeStore implements AuditRuntimeStore {
  readonly storeId = IN_MEMORY_AUDIT_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredAuditRuntimeJob>();
  private readonly requests = new Map<string, StoredAuditRuntimeRequest>();
  private readonly findings = new Map<string, StoredAuditRuntimeFinding>();
  private readonly results = new Map<string, StoredAuditRuntimeResult>();

  constructor(options: InMemoryAuditRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const finding of options.findings ?? []) this.setFinding(finding);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredAuditRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredAuditRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredAuditRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredAuditRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredAuditRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredAuditRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getFinding(findingId: string): StoredAuditRuntimeFinding | undefined {
    const finding = this.findings.get(findingId);
    return finding ? { ...finding } : undefined;
  }

  setFinding(finding: StoredAuditRuntimeFinding): void {
    this.findings.set(finding.findingId, { ...finding });
  }

  listFindings(jobId?: string): readonly StoredAuditRuntimeFinding[] {
    const all = Array.from(this.findings.values()).map((finding) => ({ ...finding }));
    if (!jobId) return all;
    return all.filter((finding) => finding.jobId === jobId);
  }

  findingCount(): number {
    return this.findings.size;
  }

  getResult(resultId: string): StoredAuditRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredAuditRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredAuditRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): AuditStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-audit-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalFindings: this.findingCount(),
      totalResults: this.resultCount(),
      auditEngineImplementedCount: 0,
      businessRulesImplementedCount: 0,
      tissAuditImplementedCount: 0,
      operatorAuditImplementedCount: 0,
      automaticAuditImplementedCount: 0,
      auditSuggestionsImplementedCount: 0,
      auditJustificationImplementedCount: 0,
      auditScoreImplementedCount: 0,
      complianceImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Audit Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.findingCount()} findings, ${this.resultCount()} results).`,
    };
  }
}
