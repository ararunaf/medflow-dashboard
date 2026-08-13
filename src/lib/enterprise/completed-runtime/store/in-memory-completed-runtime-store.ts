/**
 * InMemoryCompletedRuntimeStore — store in-process oficial (A10-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem completedoria real).
 */
import type { CompletedStatistics } from "../ports/canonical";
import type {
  CompletedRuntimeStore,
  StoredCompletedRuntimeFinding,
  StoredCompletedRuntimeJob,
  StoredCompletedRuntimeRequest,
  StoredCompletedRuntimeResult,
} from "./completed-runtime-store";

export const IN_MEMORY_COMPLETED_RUNTIME_STORE_ID = "in-memory-completed-runtime";

export type InMemoryCompletedRuntimeStoreOptions = {
  jobs?: readonly StoredCompletedRuntimeJob[];
  requests?: readonly StoredCompletedRuntimeRequest[];
  findings?: readonly StoredCompletedRuntimeFinding[];
  results?: readonly StoredCompletedRuntimeResult[];
};

export class InMemoryCompletedRuntimeStore implements CompletedRuntimeStore {
  readonly storeId = IN_MEMORY_COMPLETED_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredCompletedRuntimeJob>();
  private readonly requests = new Map<string, StoredCompletedRuntimeRequest>();
  private readonly findings = new Map<string, StoredCompletedRuntimeFinding>();
  private readonly results = new Map<string, StoredCompletedRuntimeResult>();

  constructor(options: InMemoryCompletedRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const finding of options.findings ?? []) this.setFinding(finding);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredCompletedRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredCompletedRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredCompletedRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredCompletedRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredCompletedRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredCompletedRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getFinding(findingId: string): StoredCompletedRuntimeFinding | undefined {
    const finding = this.findings.get(findingId);
    return finding ? { ...finding } : undefined;
  }

  setFinding(finding: StoredCompletedRuntimeFinding): void {
    this.findings.set(finding.findingId, { ...finding });
  }

  listFindings(jobId?: string): readonly StoredCompletedRuntimeFinding[] {
    const all = Array.from(this.findings.values()).map((finding) => ({ ...finding }));
    if (!jobId) return all;
    return all.filter((finding) => finding.jobId === jobId);
  }

  findingCount(): number {
    return this.findings.size;
  }

  getResult(resultId: string): StoredCompletedRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredCompletedRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredCompletedRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CompletedStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-completed-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalFindings: this.findingCount(),
      totalResults: this.resultCount(),
      completedEngineImplementedCount: 0,
      businessRulesImplementedCount: 0,
      tissCompletedImplementedCount: 0,
      operatorCompletedImplementedCount: 0,
      automaticCompletedImplementedCount: 0,
      completedSuggestionsImplementedCount: 0,
      completedJustificationImplementedCount: 0,
      completedScoreImplementedCount: 0,
      complianceImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Completed Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.findingCount()} findings, ${this.resultCount()} results).`,
    };
  }
}
