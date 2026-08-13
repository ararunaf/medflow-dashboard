/**
 * InMemoryIdentityRuntimeStore — store in-process oficial (S2-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem identidade real).
 */
import type { IdentityStatistics } from "../ports/canonical";
import type {
  IdentityRuntimeStore,
  StoredIdentityRuntimeFinding,
  StoredIdentityRuntimeJob,
  StoredIdentityRuntimeRequest,
  StoredIdentityRuntimeResult,
} from "./identity-runtime-store";

export const IN_MEMORY_IDENTITY_RUNTIME_STORE_ID = "in-memory-identity-runtime";

export type InMemoryIdentityRuntimeStoreOptions = {
  jobs?: readonly StoredIdentityRuntimeJob[];
  requests?: readonly StoredIdentityRuntimeRequest[];
  findings?: readonly StoredIdentityRuntimeFinding[];
  results?: readonly StoredIdentityRuntimeResult[];
};

export class InMemoryIdentityRuntimeStore implements IdentityRuntimeStore {
  readonly storeId = IN_MEMORY_IDENTITY_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredIdentityRuntimeJob>();
  private readonly requests = new Map<string, StoredIdentityRuntimeRequest>();
  private readonly findings = new Map<string, StoredIdentityRuntimeFinding>();
  private readonly results = new Map<string, StoredIdentityRuntimeResult>();

  constructor(options: InMemoryIdentityRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const finding of options.findings ?? []) this.setFinding(finding);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredIdentityRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredIdentityRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredIdentityRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredIdentityRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredIdentityRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredIdentityRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getFinding(findingId: string): StoredIdentityRuntimeFinding | undefined {
    const finding = this.findings.get(findingId);
    return finding ? { ...finding } : undefined;
  }

  setFinding(finding: StoredIdentityRuntimeFinding): void {
    this.findings.set(finding.findingId, { ...finding });
  }

  listFindings(jobId?: string): readonly StoredIdentityRuntimeFinding[] {
    const all = Array.from(this.findings.values()).map((finding) => ({ ...finding }));
    if (!jobId) return all;
    return all.filter((finding) => finding.jobId === jobId);
  }

  findingCount(): number {
    return this.findings.size;
  }

  getResult(resultId: string): StoredIdentityRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredIdentityRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredIdentityRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): IdentityStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-identity-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalFindings: this.findingCount(),
      totalResults: this.resultCount(),
      identityEngineImplementedCount: 0,
      businessRulesImplementedCount: 0,
      tissIdentityImplementedCount: 0,
      operatorIdentityImplementedCount: 0,
      automaticIdentityImplementedCount: 0,
      identitySuggestionsImplementedCount: 0,
      identityJustificationImplementedCount: 0,
      identityScoreImplementedCount: 0,
      complianceImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Identity Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.findingCount()} findings, ${this.resultCount()} results).`,
    };
  }
}
