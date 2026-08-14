/**
 * InMemoryTenantRuntimeStore — store in-process oficial (S3-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem identidade real).
 */
import type { TenantStatistics } from "../ports/canonical";
import type {
  TenantRuntimeStore,
  StoredTenantRuntimeFinding,
  StoredTenantRuntimeJob,
  StoredTenantRuntimeRequest,
  StoredTenantRuntimeResult,
} from "./tenant-runtime-store";

export const IN_MEMORY_TENANT_RUNTIME_STORE_ID = "in-memory-tenant-runtime";

export type InMemoryTenantRuntimeStoreOptions = {
  jobs?: readonly StoredTenantRuntimeJob[];
  requests?: readonly StoredTenantRuntimeRequest[];
  findings?: readonly StoredTenantRuntimeFinding[];
  results?: readonly StoredTenantRuntimeResult[];
};

export class InMemoryTenantRuntimeStore implements TenantRuntimeStore {
  readonly storeId = IN_MEMORY_TENANT_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredTenantRuntimeJob>();
  private readonly requests = new Map<string, StoredTenantRuntimeRequest>();
  private readonly findings = new Map<string, StoredTenantRuntimeFinding>();
  private readonly results = new Map<string, StoredTenantRuntimeResult>();

  constructor(options: InMemoryTenantRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const finding of options.findings ?? []) this.setFinding(finding);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredTenantRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredTenantRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredTenantRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredTenantRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredTenantRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredTenantRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getFinding(findingId: string): StoredTenantRuntimeFinding | undefined {
    const finding = this.findings.get(findingId);
    return finding ? { ...finding } : undefined;
  }

  setFinding(finding: StoredTenantRuntimeFinding): void {
    this.findings.set(finding.findingId, { ...finding });
  }

  listFindings(jobId?: string): readonly StoredTenantRuntimeFinding[] {
    const all = Array.from(this.findings.values()).map((finding) => ({ ...finding }));
    if (!jobId) return all;
    return all.filter((finding) => finding.jobId === jobId);
  }

  findingCount(): number {
    return this.findings.size;
  }

  getResult(resultId: string): StoredTenantRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredTenantRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredTenantRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): TenantStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-tenant-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalFindings: this.findingCount(),
      totalResults: this.resultCount(),
      tenantEngineImplementedCount: 0,
      businessRulesImplementedCount: 0,
      tissTenantImplementedCount: 0,
      operatorTenantImplementedCount: 0,
      automaticTenantImplementedCount: 0,
      tenantSuggestionsImplementedCount: 0,
      tenantJustificationImplementedCount: 0,
      tenantScoreImplementedCount: 0,
      complianceImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Tenant Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.findingCount()} findings, ${this.resultCount()} results).`,
    };
  }
}
