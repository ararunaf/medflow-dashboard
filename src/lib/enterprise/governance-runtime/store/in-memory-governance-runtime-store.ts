/**
 * InMemoryGovernanceRuntimeStore — store in-process oficial (S6-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem identidade real).
 */
import type { GovernanceStatistics } from "../ports/canonical";
import type {
  GovernanceRuntimeStore,
  StoredGovernanceRuntimeFinding,
  StoredGovernanceRuntimeJob,
  StoredGovernanceRuntimeRequest,
  StoredGovernanceRuntimeResult,
} from "./governance-runtime-store";

export const IN_MEMORY_GOVERNANCE_RUNTIME_STORE_ID = "in-memory-governance-runtime";

export type InMemoryGovernanceRuntimeStoreOptions = {
  jobs?: readonly StoredGovernanceRuntimeJob[];
  requests?: readonly StoredGovernanceRuntimeRequest[];
  findings?: readonly StoredGovernanceRuntimeFinding[];
  results?: readonly StoredGovernanceRuntimeResult[];
};

export class InMemoryGovernanceRuntimeStore implements GovernanceRuntimeStore {
  readonly storeId = IN_MEMORY_GOVERNANCE_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredGovernanceRuntimeJob>();
  private readonly requests = new Map<string, StoredGovernanceRuntimeRequest>();
  private readonly findings = new Map<string, StoredGovernanceRuntimeFinding>();
  private readonly results = new Map<string, StoredGovernanceRuntimeResult>();

  constructor(options: InMemoryGovernanceRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const finding of options.findings ?? []) this.setFinding(finding);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredGovernanceRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredGovernanceRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredGovernanceRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredGovernanceRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredGovernanceRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredGovernanceRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getFinding(findingId: string): StoredGovernanceRuntimeFinding | undefined {
    const finding = this.findings.get(findingId);
    return finding ? { ...finding } : undefined;
  }

  setFinding(finding: StoredGovernanceRuntimeFinding): void {
    this.findings.set(finding.findingId, { ...finding });
  }

  listFindings(jobId?: string): readonly StoredGovernanceRuntimeFinding[] {
    const all = Array.from(this.findings.values()).map((finding) => ({ ...finding }));
    if (!jobId) return all;
    return all.filter((finding) => finding.jobId === jobId);
  }

  findingCount(): number {
    return this.findings.size;
  }

  getResult(resultId: string): StoredGovernanceRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredGovernanceRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredGovernanceRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): GovernanceStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-governance-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalFindings: this.findingCount(),
      totalResults: this.resultCount(),
      governanceEngineImplementedCount: 0,
      businessRulesImplementedCount: 0,
      tissGovernanceImplementedCount: 0,
      operatorGovernanceImplementedCount: 0,
      automaticGovernanceImplementedCount: 0,
      governanceSuggestionsImplementedCount: 0,
      governanceJustificationImplementedCount: 0,
      governanceScoreImplementedCount: 0,
      governanceImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Governance Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.findingCount()} findings, ${this.resultCount()} results).`,
    };
  }
}
