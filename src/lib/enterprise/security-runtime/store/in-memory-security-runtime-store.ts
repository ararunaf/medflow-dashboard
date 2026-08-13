/**
 * InMemorySecurityRuntimeStore — store in-process oficial (S1-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem segurança real).
 */
import type { SecurityStatistics } from "../ports/canonical";
import type {
  SecurityRuntimeStore,
  StoredSecurityRuntimeFinding,
  StoredSecurityRuntimeJob,
  StoredSecurityRuntimeRequest,
  StoredSecurityRuntimeResult,
} from "./security-runtime-store";

export const IN_MEMORY_SECURITY_RUNTIME_STORE_ID = "in-memory-security-runtime";

export type InMemorySecurityRuntimeStoreOptions = {
  jobs?: readonly StoredSecurityRuntimeJob[];
  requests?: readonly StoredSecurityRuntimeRequest[];
  findings?: readonly StoredSecurityRuntimeFinding[];
  results?: readonly StoredSecurityRuntimeResult[];
};

export class InMemorySecurityRuntimeStore implements SecurityRuntimeStore {
  readonly storeId = IN_MEMORY_SECURITY_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredSecurityRuntimeJob>();
  private readonly requests = new Map<string, StoredSecurityRuntimeRequest>();
  private readonly findings = new Map<string, StoredSecurityRuntimeFinding>();
  private readonly results = new Map<string, StoredSecurityRuntimeResult>();

  constructor(options: InMemorySecurityRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const finding of options.findings ?? []) this.setFinding(finding);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredSecurityRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredSecurityRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredSecurityRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredSecurityRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredSecurityRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredSecurityRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getFinding(findingId: string): StoredSecurityRuntimeFinding | undefined {
    const finding = this.findings.get(findingId);
    return finding ? { ...finding } : undefined;
  }

  setFinding(finding: StoredSecurityRuntimeFinding): void {
    this.findings.set(finding.findingId, { ...finding });
  }

  listFindings(jobId?: string): readonly StoredSecurityRuntimeFinding[] {
    const all = Array.from(this.findings.values()).map((finding) => ({ ...finding }));
    if (!jobId) return all;
    return all.filter((finding) => finding.jobId === jobId);
  }

  findingCount(): number {
    return this.findings.size;
  }

  getResult(resultId: string): StoredSecurityRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredSecurityRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredSecurityRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): SecurityStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-security-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalFindings: this.findingCount(),
      totalResults: this.resultCount(),
      securityEngineImplementedCount: 0,
      businessRulesImplementedCount: 0,
      tissSecurityImplementedCount: 0,
      operatorSecurityImplementedCount: 0,
      automaticSecurityImplementedCount: 0,
      securitySuggestionsImplementedCount: 0,
      securityJustificationImplementedCount: 0,
      securityScoreImplementedCount: 0,
      complianceImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Security Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.findingCount()} findings, ${this.resultCount()} results).`,
    };
  }
}
