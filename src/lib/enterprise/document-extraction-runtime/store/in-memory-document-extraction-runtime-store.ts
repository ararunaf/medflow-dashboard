/**
 * InMemoryDocumentExtractionRuntimeStore — store in-process oficial (F3-CAP-07).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem extração real).
 */
import type { ExtractionStatistics } from "../ports/canonical";
import type {
  DocumentExtractionRuntimeStore,
  StoredDocumentExtractionRuntimeDocument,
  StoredDocumentExtractionRuntimeJob,
  StoredDocumentExtractionRuntimeRequest,
  StoredDocumentExtractionRuntimeResult,
} from "./document-extraction-runtime-store";

export const IN_MEMORY_DOCUMENT_EXTRACTION_RUNTIME_STORE_ID =
  "in-memory-document-extraction-runtime";

export type InMemoryDocumentExtractionRuntimeStoreOptions = {
  jobs?: readonly StoredDocumentExtractionRuntimeJob[];
  requests?: readonly StoredDocumentExtractionRuntimeRequest[];
  documents?: readonly StoredDocumentExtractionRuntimeDocument[];
  results?: readonly StoredDocumentExtractionRuntimeResult[];
};

export class InMemoryDocumentExtractionRuntimeStore implements DocumentExtractionRuntimeStore {
  readonly storeId = IN_MEMORY_DOCUMENT_EXTRACTION_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredDocumentExtractionRuntimeJob>();
  private readonly requests = new Map<string, StoredDocumentExtractionRuntimeRequest>();
  private readonly documents = new Map<string, StoredDocumentExtractionRuntimeDocument>();
  private readonly results = new Map<string, StoredDocumentExtractionRuntimeResult>();

  constructor(options: InMemoryDocumentExtractionRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const document of options.documents ?? []) this.setDocument(document);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredDocumentExtractionRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredDocumentExtractionRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredDocumentExtractionRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredDocumentExtractionRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredDocumentExtractionRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredDocumentExtractionRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getDocument(documentId: string): StoredDocumentExtractionRuntimeDocument | undefined {
    const document = this.documents.get(documentId);
    return document ? { ...document } : undefined;
  }

  setDocument(document: StoredDocumentExtractionRuntimeDocument): void {
    this.documents.set(document.documentId, { ...document });
  }

  listDocuments(jobId?: string): readonly StoredDocumentExtractionRuntimeDocument[] {
    const all = Array.from(this.documents.values()).map((document) => ({ ...document }));
    if (!jobId) return all;
    return all.filter((document) => document.jobId === jobId);
  }

  documentCount(): number {
    return this.documents.size;
  }

  getResult(resultId: string): StoredDocumentExtractionRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredDocumentExtractionRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredDocumentExtractionRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): ExtractionStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-extraction-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalDocuments: this.documentCount(),
      totalResults: this.resultCount(),
      fieldExtractionImplementedCount: 0,
      structuredExtractionImplementedCount: 0,
      medicalGuideExtractionImplementedCount: 0,
      tableExtractionImplementedCount: 0,
      templateExtractionImplementedCount: 0,
      automaticMappingImplementedCount: 0,
      confidenceScoreImplementedCount: 0,
      barcodeExtractionImplementedCount: 0,
      qrExtractionImplementedCount: 0,
      pipelineSelectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Document Extraction Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.documentCount()} documents, ${this.resultCount()} results).`,
    };
  }
}
