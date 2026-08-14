/**
 * InMemoryComplianceRuntimeStore — store in-process oficial (S3-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem identidade real).
 */
import type { ComplianceStatistics } from "../ports/canonical";
import type {
  ComplianceRuntimeStore,
  StoredComplianceRuntimeFinding,
  StoredComplianceRuntimeJob,
  StoredComplianceRuntimeRequest,
  StoredComplianceRuntimeResult,
} from "./compliance-runtime-store";

export const IN_MEMORY_COMPLIANCE_RUNTIME_STORE_ID = "in-memory-compliance-runtime";

export type InMemoryComplianceRuntimeStoreOptions = {
  jobs?: readonly StoredComplianceRuntimeJob[];
  requests?: readonly StoredComplianceRuntimeRequest[];
  findings?: readonly StoredComplianceRuntimeFinding[];
  results?: readonly StoredComplianceRuntimeResult[];
};

export class InMemoryComplianceRuntimeStore implements ComplianceRuntimeStore {
  readonly storeId = IN_MEMORY_COMPLIANCE_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredComplianceRuntimeJob>();
  private readonly requests = new Map<string, StoredComplianceRuntimeRequest>();
  private readonly findings = new Map<string, StoredComplianceRuntimeFinding>();
  private readonly results = new Map<string, StoredComplianceRuntimeResult>();

  constructor(options: InMemoryComplianceRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const finding of options.findings ?? []) this.setFinding(finding);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredComplianceRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredComplianceRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredComplianceRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredComplianceRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredComplianceRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredComplianceRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getFinding(findingId: string): StoredComplianceRuntimeFinding | undefined {
    const finding = this.findings.get(findingId);
    return finding ? { ...finding } : undefined;
  }

  setFinding(finding: StoredComplianceRuntimeFinding): void {
    this.findings.set(finding.findingId, { ...finding });
  }

  listFindings(jobId?: string): readonly StoredComplianceRuntimeFinding[] {
    const all = Array.from(this.findings.values()).map((finding) => ({ ...finding }));
    if (!jobId) return all;
    return all.filter((finding) => finding.jobId === jobId);
  }

  findingCount(): number {
    return this.findings.size;
  }

  getResult(resultId: string): StoredComplianceRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredComplianceRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredComplianceRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): ComplianceStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-compliance-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalFindings: this.findingCount(),
      totalResults: this.resultCount(),
      complianceEngineImplementedCount: 0,
      businessRulesImplementedCount: 0,
      tissComplianceImplementedCount: 0,
      operatorComplianceImplementedCount: 0,
      automaticComplianceImplementedCount: 0,
      complianceSuggestionsImplementedCount: 0,
      complianceJustificationImplementedCount: 0,
      complianceScoreImplementedCount: 0,
      complianceImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Compliance Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.findingCount()} findings, ${this.resultCount()} results).`,
    };
  }
}
