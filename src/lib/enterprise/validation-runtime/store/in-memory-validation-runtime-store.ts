/**
 * InMemoryValidationRuntimeStore — store in-process oficial (F3-CAP-08).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem validação real).
 */
import type { ValidationStatistics } from "../ports/canonical";
import type {
  StoredValidationRuntimeDocument,
  StoredValidationRuntimeJob,
  StoredValidationRuntimeRequest,
  StoredValidationRuntimeResult,
  ValidationRuntimeStore,
} from "./validation-runtime-store";

export const IN_MEMORY_VALIDATION_RUNTIME_STORE_ID = "in-memory-validation-runtime";

export type InMemoryValidationRuntimeStoreOptions = {
  jobs?: readonly StoredValidationRuntimeJob[];
  requests?: readonly StoredValidationRuntimeRequest[];
  documents?: readonly StoredValidationRuntimeDocument[];
  results?: readonly StoredValidationRuntimeResult[];
};

export class InMemoryValidationRuntimeStore implements ValidationRuntimeStore {
  readonly storeId = IN_MEMORY_VALIDATION_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredValidationRuntimeJob>();
  private readonly requests = new Map<string, StoredValidationRuntimeRequest>();
  private readonly documents = new Map<string, StoredValidationRuntimeDocument>();
  private readonly results = new Map<string, StoredValidationRuntimeResult>();

  constructor(options: InMemoryValidationRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const document of options.documents ?? []) this.setDocument(document);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredValidationRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredValidationRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredValidationRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredValidationRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredValidationRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredValidationRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getDocument(documentId: string): StoredValidationRuntimeDocument | undefined {
    const document = this.documents.get(documentId);
    return document ? { ...document } : undefined;
  }

  setDocument(document: StoredValidationRuntimeDocument): void {
    this.documents.set(document.documentId, { ...document });
  }

  listDocuments(jobId?: string): readonly StoredValidationRuntimeDocument[] {
    const all = Array.from(this.documents.values()).map((document) => ({ ...document }));
    if (!jobId) return all;
    return all.filter((document) => document.jobId === jobId);
  }

  documentCount(): number {
    return this.documents.size;
  }

  getResult(resultId: string): StoredValidationRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredValidationRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredValidationRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): ValidationStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-validation-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalDocuments: this.documentCount(),
      totalResults: this.resultCount(),
      fieldValidationImplementedCount: 0,
      documentValidationImplementedCount: 0,
      templateValidationImplementedCount: 0,
      operatorValidationImplementedCount: 0,
      tissValidationImplementedCount: 0,
      confidenceValidationImplementedCount: 0,
      qualityValidationImplementedCount: 0,
      mandatoryFieldValidationImplementedCount: 0,
      crossFieldValidationImplementedCount: 0,
      businessRuleValidationImplementedCount: 0,
      automaticApprovalImplementedCount: 0,
      automaticRejectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Validation Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.documentCount()} documents, ${this.resultCount()} results).`,
    };
  }
}
