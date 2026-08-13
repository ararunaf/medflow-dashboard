/**
 * InMemoryAuthorizationRuntimeStore — store in-process oficial (S3-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem identidade real).
 */
import type { AuthorizationStatistics } from "../ports/canonical";
import type {
  AuthorizationRuntimeStore,
  StoredAuthorizationRuntimeFinding,
  StoredAuthorizationRuntimeJob,
  StoredAuthorizationRuntimeRequest,
  StoredAuthorizationRuntimeResult,
} from "./authorization-runtime-store";

export const IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID = "in-memory-authorization-runtime";

export type InMemoryAuthorizationRuntimeStoreOptions = {
  jobs?: readonly StoredAuthorizationRuntimeJob[];
  requests?: readonly StoredAuthorizationRuntimeRequest[];
  findings?: readonly StoredAuthorizationRuntimeFinding[];
  results?: readonly StoredAuthorizationRuntimeResult[];
};

export class InMemoryAuthorizationRuntimeStore implements AuthorizationRuntimeStore {
  readonly storeId = IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredAuthorizationRuntimeJob>();
  private readonly requests = new Map<string, StoredAuthorizationRuntimeRequest>();
  private readonly findings = new Map<string, StoredAuthorizationRuntimeFinding>();
  private readonly results = new Map<string, StoredAuthorizationRuntimeResult>();

  constructor(options: InMemoryAuthorizationRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const finding of options.findings ?? []) this.setFinding(finding);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredAuthorizationRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredAuthorizationRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredAuthorizationRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredAuthorizationRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredAuthorizationRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredAuthorizationRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getFinding(findingId: string): StoredAuthorizationRuntimeFinding | undefined {
    const finding = this.findings.get(findingId);
    return finding ? { ...finding } : undefined;
  }

  setFinding(finding: StoredAuthorizationRuntimeFinding): void {
    this.findings.set(finding.findingId, { ...finding });
  }

  listFindings(jobId?: string): readonly StoredAuthorizationRuntimeFinding[] {
    const all = Array.from(this.findings.values()).map((finding) => ({ ...finding }));
    if (!jobId) return all;
    return all.filter((finding) => finding.jobId === jobId);
  }

  findingCount(): number {
    return this.findings.size;
  }

  getResult(resultId: string): StoredAuthorizationRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredAuthorizationRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredAuthorizationRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): AuthorizationStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-authorization-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalFindings: this.findingCount(),
      totalResults: this.resultCount(),
      authorizationEngineImplementedCount: 0,
      businessRulesImplementedCount: 0,
      tissAuthorizationImplementedCount: 0,
      operatorAuthorizationImplementedCount: 0,
      automaticAuthorizationImplementedCount: 0,
      authorizationSuggestionsImplementedCount: 0,
      authorizationJustificationImplementedCount: 0,
      authorizationScoreImplementedCount: 0,
      complianceImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Authorization Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.findingCount()} findings, ${this.resultCount()} results).`,
    };
  }
}
